import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Bot, User, Trash2 } from "lucide-react"
import { Button, Loader, Toast } from "../components/ui"
import { detectSpam } from "../data/spamFilter"
import { useProperty } from "../context/PropertyContext"

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hello! I'm your RevLens AI review intelligence assistant. Ask me anything about your properties, customer sentiments, or specific guest concerns, and I'll scour your reviews to answer!",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
]

const SUGGESTED_PROMPTS = [
  "What is the main complaint about Mountain Retreat?",
  "Summarize our WiFi issues.",
  "Show a breakdown of our sentiment.",
  "Draft a response for Arjun Nair.",
]

// Render markdown-style bold and code blocks in responses
function formatResponseText(text) {
  if (!text) return "";
  
  // Parse code blocks first
  const codeBlockRegex = /```(?:[a-zA-Z]+)?\n([\s\S]*?)\n```/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex, match.index)
      });
    }
    parts.push({
      type: "code",
      content: match[1]
    });
    lastIndex = codeBlockRegex.lastIndex;
  }
  
  if (lastIndex < text.length) {
    parts.push({
      type: "text",
      content: text.substring(lastIndex)
    });
  }
  
  return parts.map((part, partIdx) => {
    if (part.type === "code") {
      return (
        <pre key={partIdx} className="bg-black/10 dark:bg-black/40 p-3 rounded-lg my-2 font-mono text-xs overflow-x-auto border border-black/5 dark:border-white/5 select-all text-left">
          <code>{part.content}</code>
        </pre>
      );
    } else {
      const textParts = part.content.split(/(\*\*[^\s\*](?:.*?[^\s\*])?\*\*|\*[^\s\*](?:.*?[^\s\*])?\*)/g);
      return (
        <span key={partIdx}>
          {textParts.map((tPart, tIdx) => {
            if (tPart.startsWith("**") && tPart.endsWith("**")) {
              return (
                <strong key={tIdx} className="font-bold text-(--color-brand-600) dark:text-(--color-accent-300)">
                  {tPart.slice(2, -2)}
                </strong>
              );
            } else if (tPart.startsWith("*") && tPart.endsWith("*")) {
              return (
                <em key={tIdx} className="italic text-(--color-brand-600) dark:text-(--color-brand-300) opacity-95">
                  {tPart.slice(1, -1)}
                </em>
              );
            }
            return tPart;
          })}
        </span>
      );
    }
  });
}

export default function Assistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)
  const chatContainerRef = useRef(null)

  const { reviews, properties, loading, error } = useProperty()
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    if (error) {
      setToastMessage(error)
    }
  }, [error])
 
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }
 
  useEffect(() => {
    scrollToBottom()
  }, [messages, isThinking])
 
  const handleSend = (textToSend) => {
    const queryText = textToSend || inputValue
    if (!queryText.trim()) return
 
    const userMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
 
    setMessages((prev) => [...prev, userMessage])
    if (!textToSend) setInputValue("")
 
    setIsThinking(true)
 
    // Simulate AI thinking and building search response
    setTimeout(() => {
      const responseText = processQuery(queryText)
      const botMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMessage])
      setIsThinking(false)
    }, 900)
  }
 
  const handleClearChat = () => {
    setMessages(INITIAL_MESSAGES)
  }

  // Real-time NLP processor over live database reviews
  const processQuery = (query) => {
    const q = query.toLowerCase()

    // Spam / Bot Queries
    if (q.includes("spam") || q.includes("fake") || q.includes("bot") || q.includes("suspicious")) {
      const spamReviews = reviews.filter(r => r.isSpam)
      if (spamReviews.length > 0) {
        let list = spamReviews.map(r => {
          const analysis = detectSpam(r.text, r.guestName)
          return `• **${r.guestName}** at **${r.propertyName}** (Flagged: ${analysis.reason})\n  *"${r.text}"*`
        }).join("\n\n")
        return `I scanned your database and flagged **${spamReviews.length} reviews** as spam or fake bot activity:\n\n${list}\n\nI have isolated these from your overview stats and average rating. You can view, delete, or approve them in the **Reviews** inbox.`
      }
      return "Clean scan! No suspicious reviews or fake bot accounts detected in the current dataset."
    }

    // 1. WiFi Queries
    if (q.includes("wifi") || q.includes("internet") || q.includes("speed")) {
      const wifiMentions = reviews.filter(r => r.text.toLowerCase().includes("wifi") || r.text.toLowerCase().includes("internet"))
      if (wifiMentions.length > 0) {
        let details = wifiMentions.map(r => `• **${r.guestName}** at **${r.propertyName}** (${r.rating}★, ${r.sentiment}): "${r.text}"`).join("\n\n")
        const worstReview = wifiMentions.find(r => r.rating <= 2)
        const targetProp = worstReview ? worstReview.propertyName : wifiMentions[0].propertyName
        return `I analyzed your review database and found **${wifiMentions.length} mention(s)** of internet/WiFi issues:\n\n${details}\n\n**Action Item**: Consider upgrading the router or data plan at **${targetProp}** since this directly impacted guest reviews.`
      }
      return "No guest reviews currently mention WiFi or internet speed issues in the system."
    }

    // 2. Specific Property Query (e.g. Mountain Retreat or general property matching)
    const matchedProp = properties.find(p => q.includes(p.name.toLowerCase()) || q.includes(p.location.toLowerCase()))
    if (matchedProp || q.includes("mountain retreat") || q.includes("heating") || q.includes("insulation") || q.includes("arjun")) {
      const targetPropName = matchedProp ? matchedProp.name : "Mountain Retreat"
      const targetPropId = matchedProp ? matchedProp.id : 3
      const retreatReviews = reviews.filter(r => r.propertyId === targetPropId || r.propertyName.toLowerCase() === targetPropName.toLowerCase())
      const complaints = retreatReviews.filter(r => r.sentiment === "negative" || r.rating <= 3)
      const positives = retreatReviews.filter(r => r.sentiment === "positive")

      let reply = `Here is a summary of the feedback for **${targetPropName}** (${retreatReviews.length} reviews total):\n\n`
      if (positives.length > 0) {
        reply += `**Strengths**: Guests like **${positives[0].guestName}** (${positives[0].rating}★) praised the property: "${positives[0].text}"\n\n`
      }
      if (complaints.length > 0) {
        reply += `**Complaints**: \n`
        complaints.forEach(r => {
          reply += `• **${r.guestName}** (${r.rating}★) reported: "${r.text}"\n`
        })
        
        const isHeatingComplaint = complaints.some(r => r.text.toLowerCase().includes("heat") || r.text.toLowerCase().includes("cold") || r.text.toLowerCase().includes("warm"))
        if (isHeatingComplaint) {
          reply += `\n**AI Recommendation**: The primary complaint centers on **heating systems** and room temperature. I suggest auditing the heaters and insulation before guest check-in for the winter season.`
        } else {
          reply += `\n**AI Recommendation**: Address the service/amenity issues highlighted by guest complaints above to prevent repeat low scores.`
        }
      }
      return reply
    }

    // 3. Negative Reviews / Common Complaints
    if (q.includes("negative") || q.includes("complaint") || q.includes("bad") || q.includes("issue") || q.includes("critic")) {
      const negativeReviews = reviews.filter(r => (r.sentiment === "negative" || r.rating <= 2) && !r.isSpam)
      if (negativeReviews.length > 0) {
        let list = negativeReviews.map((r, index) => `${index + 1}. **${r.propertyName}** — **${r.guestName}** (${r.rating}★): "${r.text}"`).join("\n")
        return `Here are the active negative/critical reviews in your system:\n\n${list}\n\n**Common Themes**:\n• Heating/Insulation at Mountain Retreat.\n• Location and expectations at Lakeview Cottage.`
      }
      return "Excellent! There are no negative reviews (rating 2★ or below) registered in the active dataset."
    }

    // 4. Cleanliness Queries
    if (q.includes("clean") || q.includes("dirty") || q.includes("hygiene")) {
      const cleanMentions = reviews.filter(r => r.text.toLowerCase().includes("clean") || r.text.toLowerCase().includes("spotless"))
      if (cleanMentions.length > 0) {
        let details = cleanMentions.map(r => `• **${r.guestName}** (${r.propertyName}): "${r.text}"`).join("\n")
        return `Cleanliness is a major strength for your properties! I found **${cleanMentions.length} reviews** praising it:\n\n${details}\n\nThere are no hygiene complaints detected.`
      }
      return "No reviews specifically mention cleanliness or hygiene feedback in this batch."
    }

    // 5. Sentiment breakdown
    if (q.includes("sentiment") || q.includes("breakdown") || q.includes("stat") || q.includes("distribution")) {
      const validReviews = reviews.filter(r => !r.isSpam)
      const positiveCount = validReviews.filter(r => r.sentiment === "positive").length
      const neutralCount = validReviews.filter(r => r.sentiment === "neutral").length
      const negativeCount = validReviews.filter(r => r.sentiment === "negative").length
      const totalReviews = validReviews.length

      const positivePct = totalReviews > 0 ? Math.round((positiveCount / totalReviews) * 100) : 0
      const neutralPct = totalReviews > 0 ? Math.round((neutralCount / totalReviews) * 100) : 0
      const negativePct = totalReviews > 0 ? Math.round((negativeCount / totalReviews) * 100) : 0

      const avg = totalReviews > 0
        ? (validReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
        : "0.0"

      return `Here is your current **Sentiment Breakdown** across all properties:\n\n*   **Positive**: ${positivePct}% (${positiveCount} reviews)\n*   **Neutral**: ${neutralPct}% (${neutralCount} reviews)\n*   **Negative**: ${negativePct}% (${negativeCount} reviews)\n\nYour average rating is **${avg}★** based on ${totalReviews} real reviews. Keeping heating issues resolved at Mountain Retreat can further optimize your ratings.`
    }

    // 6. Response Drafts / Writing Replies
    if (q.includes("draft") || q.includes("write") || q.includes("reply") || q.includes("response")) {
      // Find guest if mentioned
      const matchedReview = reviews.find(r => q.includes(r.guestName.toLowerCase()) || q.includes(r.guestName.split(" ")[0].toLowerCase()))
      if (matchedReview) {
        if (matchedReview.isSpam) {
          return `⚠️ **Spam Alert**: The review from **${matchedReview.guestName}** has been flagged as suspicious bot activity. I recommend **deleting** this review on the Reviews dashboard rather than replying to it.`
        }

        let draftText = ""
        if (matchedReview.sentiment === "positive") {
          draftText = `Dear ${matchedReview.guestName},\n\nThank you for the wonderful 5-star review of ${matchedReview.propertyName}! We are absolutely thrilled you enjoyed the amenities and views. We hope to welcome you back again soon!\n\nBest regards,\nManagement`
        } else if (matchedReview.sentiment === "negative") {
          draftText = `Dear ${matchedReview.guestName},\n\nThank you for your feedback regarding your stay at ${matchedReview.propertyName}. We sincerely apologize that the heating system and room size did not meet expectations. We have scheduled an engineering check to fix the heater immediately. We appreciate your feedback to help us improve.\n\nBest regards,\nManagement`
        } else {
          draftText = `Dear ${matchedReview.guestName},\n\nThank you for sharing your experience at ${matchedReview.propertyName}. We appreciate your notes on check-in times and insulation. We are working on these details to enhance our future stays.\n\nBest regards,\nManagement`
        }
        return `Here is a custom AI drafted reply for **${matchedReview.guestName}**:\n\n\`\`\`text\n${draftText}\n\`\`\`\n\nYou can copy and paste this response directly to their review thread.`
      }
      return "Who would you like me to draft a response for? Please specify a guest's name (e.g. *\"Draft a response for Arjun Nair\"* or *\"Draft a reply to Priya Sharma\"*)."
    }

    // Fallback
    return "I'm not quite sure how to analyze that query. Try asking me one of these options:\n\n*   *\"Show me our spam reviews.\"*\n*   *\"What is the main complaint about Mountain Retreat?\"*\n*   *\"Summarize our WiFi issues.\"*\n*   *\"Show a breakdown of our sentiment.\"*"
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Connecting to AI assistant..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[450px]">
      {/* Toast Alert Portal */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={`Error connecting to database: ${toastMessage}`}
            type="error"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white flex items-center gap-2">
            AI Assistant
            <Sparkles size={18} className="text-(--color-accent-400) animate-pulse-soft" />
          </h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
            Query review intelligence and draft responses contextually
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClearChat}
          icon={<Trash2 size={13} />}
          className="text-red-500 hover:text-red-600 hover:bg-red-500/5 dark:hover:bg-red-500/10 rounded-xl"
        >
          Clear Chat
        </Button>
      </div>
 
      {/* Main chat window container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-2xl overflow-hidden backdrop-blur-md shadow-lg relative">
        <div className="absolute inset-0 noise-overlay pointer-events-none" />
 
        {/* Message scroll container */}
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative z-10"
        >
          {messages.map((m) => {
            const isBot = m.sender === "bot"
            return (
              <div
                key={m.id}
                className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}
              >
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm
                  ${isBot ? "bg-(--color-accent-500)/10 border border-(--color-accent-500)/20 text-(--color-accent-500)" : "bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) text-white"}`}
                >
                  {isBot ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className="space-y-1">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-line
                    ${isBot
                      ? "bg-(--color-surface-muted)/40 dark:bg-(--color-surface-muted-dark)/50 border border-(--color-border) dark:border-(--color-border-dark)/60 text-(--color-brand-600) dark:text-white rounded-tl-none"
                      : "bg-(--color-brand-600) text-white rounded-tr-none"}`}
                  >
                    {isBot ? formatResponseText(m.text) : m.text}
                  </div>
                  <p className={`text-[9px] text-(--color-muted)/70 dark:text-(--color-muted-dark)/50 ${isBot ? "text-left pl-1" : "text-right pr-1"}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            )
          })}
 
          {isThinking && (
            <div className="flex gap-3 mr-auto max-w-[85%]">
              <div className="w-8 h-8 rounded-xl bg-(--color-accent-500)/10 border border-(--color-accent-500)/20 text-(--color-accent-500) shrink-0 flex items-center justify-center shadow-sm">
                <Bot size={14} />
              </div>
              <div className="bg-(--color-surface-muted)/40 dark:bg-(--color-surface-muted-dark)/50 border border-(--color-border) dark:border-(--color-border-dark)/60 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-bounce" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
 
        {/* Action input panel */}
        <div className="p-4 border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface-muted)/30 dark:bg-(--color-surface-muted-dark)/20 relative z-10 shrink-0">
          {/* Quick chips */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                   key={p}
                   onClick={() => handleSend(p)}
                   className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) text-(--color-brand-600) dark:text-(--color-brand-300) hover:border-(--color-brand-400) dark:hover:border-(--color-brand-500) hover:bg-(--color-brand-50)/50 dark:hover:bg-(--color-brand-900)/10 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  {p}
                </button>
              ))}
            </div>
          )}
 
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about properties, WiFi issues, negative reviews, or draft a response..."
              className="flex-1 px-4 py-3 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-sm outline-none focus:ring-2 focus:ring-(--color-brand-400)/20 focus:border-(--color-brand-400) dark:focus:border-(--color-brand-500) text-(--color-brand-600) dark:text-white transition-all shadow-inner"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputValue.trim() || isThinking}
              icon={<Send size={14} />}
              className="px-5 shrink-0 rounded-xl shadow-md hover:shadow-lg active:scale-95"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
