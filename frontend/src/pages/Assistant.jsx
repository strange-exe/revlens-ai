import { useState, useRef, useEffect } from "react"
import { Sparkles, Send, Bot, User, Trash2, AlertTriangle, Star } from "lucide-react"
import Button from "../components/ui/Button"
import Loader from "../components/ui/Loader"
import Toast from "../components/ui/Toast"
import { api } from "../services/api"
import { useProperty } from "../context/PropertyContext"
import { useDismissibleError } from "../hooks/useDismissibleError"

const now = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

const INITIAL_MESSAGES = [
  {
    id: "welcome",
    sender: "bot",
    text: "Hi! Ask me anything about your guest reviews. I answer **only from your own reviews** and show which ones I used, so you can check. To draft a reply to a guest, use **AI Reply** on the Reviews page.",
    timestamp: now(),
  },
]

const SUGGESTED_PROMPTS = [
  "What do guests complain about most?",
  "What do guests love most?",
  "Summarise what guests say about the WiFi.",
  "Which property gets the most negative reviews, and why?",
]

const MAX_QUESTION = 500

// Render markdown-style bold and code blocks in responses (React escapes all text, so this is injection-safe)
function formatResponseText(text) {
  if (!text) return ""

  const codeBlockRegex = /```(?:[a-zA-Z]+)?\n([\s\S]*?)\n```/g
  const parts = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.substring(lastIndex, match.index) })
    }
    parts.push({ type: "code", content: match[1] })
    lastIndex = codeBlockRegex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.substring(lastIndex) })
  }

  return parts.map((part, partIdx) => {
    if (part.type === "code") {
      return (
        <pre key={partIdx} className="bg-black/10 dark:bg-black/40 p-3 rounded-lg my-2 font-mono text-xs overflow-x-auto border border-black/5 dark:border-white/5 select-all text-left">
          <code>{part.content}</code>
        </pre>
      )
    }
    const textParts = part.content.split(/(\*\*[^\s*](?:.*?[^\s*])?\*\*|\*[^\s*](?:.*?[^\s*])?\*)/g)
    return (
      <span key={partIdx}>
        {textParts.map((tPart, tIdx) => {
          if (tPart.startsWith("**") && tPart.endsWith("**")) {
            return <strong key={tIdx} className="font-bold text-(--color-brand-600) dark:text-(--color-accent-300)">{tPart.slice(2, -2)}</strong>
          }
          if (tPart.startsWith("*") && tPart.endsWith("*")) {
            return <em key={tIdx} className="italic text-(--color-brand-600) dark:text-(--color-brand-300) opacity-95">{tPart.slice(1, -1)}</em>
          }
          return tPart
        })}
      </span>
    )
  })
}

/** Where an answer came from, so a missing answer is never dressed up as one. */
function AnswerMeta({ message }) {
  if (message.source === "llm") {
    return (
      <>
        {!message.answerable && (
          <p className="text-[11px] text-amber-700 dark:text-amber-400">Your reviews don&rsquo;t contain enough to answer this.</p>
        )}
        <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">
          Answered by AI from {message.considered === message.total
            ? `your ${message.total} reviews`
            : `your newest ${message.considered} of ${message.total} reviews`}
        </p>
      </>
    )
  }
  if (message.source === "unavailable" || message.source === "error") {
    return (
      <p className="flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400">
        <AlertTriangle size={11} aria-hidden="true" /> No answer was generated. Try again later.
      </p>
    )
  }
  return null
}

function Citations({ ids, reviewsById }) {
  if (!ids?.length) return null
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Based on:</span>
      {ids.map((id) => {
        const r = reviewsById.get(id)
        return (
          <span
            key={id}
            title={r ? `${r.guestName} (${r.rating}★, ${r.date}): ${r.text}` : `Review #${id}`}
            className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-(--color-brand-50) dark:bg-(--color-brand-900)/40 text-(--color-brand-600) dark:text-(--color-brand-300) ring-1 ring-(--color-border) dark:ring-(--color-border-dark) cursor-help"
          >
            {r ? <>{r.guestName} · {r.rating}<Star size={9} className="fill-current" aria-label="stars" /></> : `#${id}`}
          </span>
        )
      })}
    </div>
  )
}

export default function Assistant() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [inputValue, setInputValue] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const messagesEndRef = useRef(null)

  const { reviews, selectedPropertyId, loading, error } = useProperty()
  const [toastMessage, dismissToast] = useDismissibleError(error)
  const reviewsById = new Map(reviews.map((r) => [r.id, r]))


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isThinking])

  const handleSend = async (textToSend) => {
    const question = (textToSend || inputValue).trim()
    if (!question || isThinking) return

    setMessages((prev) => [...prev, { id: `user-${Date.now()}`, sender: "user", text: question, timestamp: now() }])
    if (!textToSend) setInputValue("")
    setIsThinking(true)

    let botMessage
    try {
      const res = await api.askAssistant(question, selectedPropertyId)
      botMessage = {
        text: res.answer, source: res.source, answerable: res.answerable,
        citations: res.citations, considered: res.reviews_considered, total: res.reviews_total,
      }
    } catch (err) {
      botMessage = { text: `Something went wrong: ${err.message || "network error"}.`, source: "error" }
    }
    setMessages((prev) => [...prev, { id: `bot-${Date.now()}`, sender: "bot", timestamp: now(), ...botMessage }])
    setIsThinking(false)
  }

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Loading your reviews..." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] min-h-[450px]">
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={`Error loading reviews: ${toastMessage}`}
            type="error"
            onClose={dismissToast}
          />
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-6 shrink-0">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-ink) dark:text-white flex items-center gap-2">
            AI Assistant
            <Sparkles size={18} className="text-(--color-accent-400)" aria-hidden="true" />
          </h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
            Answers from your own reviews, with the reviews it used
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMessages(INITIAL_MESSAGES)}
          icon={<Trash2 size={13} />}
          className="text-red-700 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 hover:bg-red-500/5 dark:hover:bg-red-500/10 rounded-xl shrink-0"
        >
          Clear Chat
        </Button>
      </div>

      {/* Main chat window container */}
      <div className="flex-1 flex flex-col min-h-0 bg-white/70 dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) rounded-2xl overflow-hidden backdrop-blur-md shadow-lg relative">

        {/* Message list: announced to screen readers as it updates */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 relative z-10" aria-live="polite" aria-busy={isThinking}>
          {messages.map((m) => {
            const isBot = m.sender === "bot"
            return (
              <div key={m.id} className={`flex gap-3 max-w-[92%] md:max-w-[75%] ${isBot ? "mr-auto" : "ml-auto flex-row-reverse"}`}>
                <div
                  className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-semibold shadow-sm
                  ${isBot ? "bg-(--color-accent-500)/10 border border-(--color-accent-500)/20 text-(--color-accent-500)" : "bg-(--color-brand-600) text-white"}`}
                  aria-hidden="true"
                >
                  {isBot ? <Bot size={14} /> : <User size={14} />}
                </div>
                <div className="space-y-1.5 min-w-0">
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-line break-words
                    ${isBot
                      ? "bg-(--color-surface-muted)/40 dark:bg-(--color-surface-muted-dark)/50 border border-(--color-border) dark:border-(--color-border-dark)/60 text-(--color-ink) dark:text-white rounded-tl-none"
                      : "bg-(--color-brand-600) text-white rounded-tr-none"}`}
                  >
                    <span className="sr-only">{isBot ? "Assistant: " : "You: "}</span>
                    {isBot ? formatResponseText(m.text) : m.text}
                  </div>
                  {isBot && <Citations ids={m.citations} reviewsById={reviewsById} />}
                  {isBot && <AnswerMeta message={m} />}
                  <p className={`text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) ${isBot ? "text-left pl-1" : "text-right pr-1"}`}>
                    {m.timestamp}
                  </p>
                </div>
              </div>
            )
          })}

          {isThinking && (
            <div className="flex gap-3 mr-auto max-w-[85%]" role="status">
              <div className="w-8 h-8 rounded-xl bg-(--color-accent-500)/10 border border-(--color-accent-500)/20 text-(--color-accent-500) shrink-0 flex items-center justify-center shadow-sm" aria-hidden="true">
                <Bot size={14} />
              </div>
              <div className="bg-(--color-surface-muted)/40 dark:bg-(--color-surface-muted-dark)/50 border border-(--color-border) dark:border-(--color-border-dark)/60 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                <span className="sr-only">Reading your reviews…</span>
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-smooth-bob [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-smooth-bob [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) animate-smooth-bob" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input panel */}
        <div className="p-4 border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface-muted)/30 dark:bg-(--color-surface-muted-dark)/20 relative z-10 shrink-0">
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => handleSend(p)}
                  disabled={isThinking}
                  className="px-3 py-1.5 text-[11px] font-semibold rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) text-(--color-brand-600) dark:text-brand-300 hover:border-(--color-brand-400) dark:hover:border-(--color-brand-500) hover:bg-(--color-brand-50)/50 dark:hover:bg-(--color-brand-900)/10 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-(--color-brand-400)"
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
              aria-label="Ask a question about your reviews"
              value={inputValue}
              maxLength={MAX_QUESTION}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about complaints, praise, a property, or a topic like WiFi..."
              className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-sm outline-none focus:ring-2 focus:ring-(--color-brand-400)/30 focus:border-(--color-brand-400) dark:focus:border-(--color-brand-500) text-(--color-ink) dark:text-white transition-all shadow-inner"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!inputValue.trim() || isThinking}
              icon={<Send size={14} />}
              aria-label="Send question"
              className="px-5 shrink-0 rounded-xl shadow-md hover:shadow-lg active:scale-95"
            />
          </form>
        </div>
      </div>
    </div>
  )
}
