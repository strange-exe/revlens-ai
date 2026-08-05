import React, { useState, useMemo, useEffect } from "react"
import ReviewCard from "../components/ReviewCard"
import { MessageSquareText, Search, Sparkles, ShieldAlert } from "lucide-react"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Modal from "../components/ui/Modal"
import Toast from "../components/ui/Toast"
import Loader from "../components/ui/Loader"
import { detectSpam } from "../data/spamFilter"
import { useProperty } from "../context/PropertyContext"

export default function Reviews() {
  const { reviews, selectedPropertyId, unflagReview, deleteReview, loading, error, updateReviewResponse, generateReply } = useProperty()

  const [viewState, setViewState] = useState({
    activeTab: "inbox", // "inbox" or "spam"
    search: "",
    activeReviewForReply: null,
    draftReplyText: "",
    isGeneratingReply: false,
    toastMessage: null
  })

  const { activeTab, search, activeReviewForReply, draftReplyText, isGeneratingReply, toastMessage } = viewState

  useEffect(() => {
    if (error) {
      setViewState(prev => ({ ...prev, toastMessage: { text: error, type: "error" } }))
    }
  }, [error])

  // Filter reviews by selected property
  const propertyReviews = useMemo(() => {
    return selectedPropertyId === "all"
      ? reviews
      : reviews.filter((r) => r.propertyId === parseInt(selectedPropertyId))
  }, [reviews, selectedPropertyId])

  // Handlers for spam interactions
  const handleUnflag = (id) => {
    unflagReview(id)
    setViewState(prev => ({ ...prev, toastMessage: "Review marked as valid and moved to Inbox." }))
  }

  const handleDelete = (id) => {
    deleteReview(id)
    setViewState(prev => ({ ...prev, toastMessage: "Flagged review deleted successfully." }))
  }

  // Calculate dynamic stats
  const inboxCount = useMemo(() => {
    return propertyReviews.filter((r) => !(detectSpam(r.text, r.guestName).isSpam && !r.isUnflagged)).length
  }, [propertyReviews])

  const spamCount = useMemo(() => {
    return propertyReviews.filter((r) => detectSpam(r.text, r.guestName).isSpam && !r.isUnflagged).length
  }, [propertyReviews])

  const filtered = useMemo(() => {
    return propertyReviews.filter((r) => {
      // 1. Tab filter
      const isSpam = detectSpam(r.text, r.guestName).isSpam && !r.isUnflagged
      if (activeTab === "inbox" && isSpam) return false
      if (activeTab === "spam" && !isSpam) return false

      // 2. Search filter
      const searchLower = search.toLowerCase()
      return (
        r.guestName.toLowerCase().includes(searchLower) ||
        r.propertyName.toLowerCase().includes(searchLower) ||
        r.text.toLowerCase().includes(searchLower)
      )
    })
  }, [propertyReviews, activeTab, search])

  // Count sentiments for valid reviews in current filter list
  const positive = useMemo(() => {
    return filtered.filter((r) => r.sentiment === "positive" && !(detectSpam(r.text, r.guestName).isSpam && !r.isUnflagged)).length
  }, [filtered])

  const negative = useMemo(() => {
    return filtered.filter((r) => r.sentiment === "negative" && !(detectSpam(r.text, r.guestName).isSpam && !r.isUnflagged)).length
  }, [filtered])

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Loading guest feedback..." />
      </div>
    )
  }

  const handleOpenReplyModal = async (review) => {
    setViewState(prev => ({
      ...prev,
      activeReviewForReply: review,
      draftReplyText: "Generating response with Gemini AI...",
      isGeneratingReply: true
    }))

    try {
      const realReply = await generateReply(review.id)
      setViewState(prev => {
        if (prev.activeReviewForReply?.id !== review.id) return prev
        return {
          ...prev,
          draftReplyText: realReply,
          isGeneratingReply: false
        }
      })
    } catch (err) {
      console.warn("Real-time Gemini generation failed, falling back to local simulation:", err)
      
      let draft = ""
      if (review.sentiment === "positive") {
        draft = `Hi ${review.guestName}, thank you so much for your wonderful review of ${review.propertyName}! We are absolutely thrilled you enjoyed your stay and hope to welcome you back soon.`
      } else if (review.sentiment === "negative") {
        draft = `Hi ${review.guestName}, we are very sorry to hear that your stay at ${review.propertyName} did not meet expectations. We are looking into the heating/insulation issues you raised to ensure they are immediately resolved.`
      } else {
        draft = `Hi ${review.guestName}, thank you for sharing your experience at ${review.propertyName}. We appreciate your constructive feedback and will work on improving check-in and noise insulation as mentioned.`
      }

      setViewState(prev => {
        if (prev.activeReviewForReply?.id !== review.id) return prev
        return {
          ...prev,
          draftReplyText: draft,
          isGeneratingReply: false
        }
      })
    }
  }

  const handleSendReply = async () => {
    try {
      await updateReviewResponse(activeReviewForReply.id, draftReplyText)
      navigator.clipboard.writeText(draftReplyText).catch(() => {})
      setViewState(prev => ({
        ...prev,
        toastMessage: { text: `Response sent to ${activeReviewForReply.guestName} and recorded in database!`, type: "success" },
        activeReviewForReply: null
      }))
    } catch (err) {
      setViewState(prev => ({
        ...prev,
        toastMessage: { text: `Failed to save response: ${err.message || err}`, type: "error" },
        activeReviewForReply: null
      }))
    }
  }

  return (
    <>
      {/* Toast Alert Portal */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={typeof toastMessage === "string" ? toastMessage : toastMessage.text}
            type={typeof toastMessage === "string" ? "success" : toastMessage.type}
            onClose={() => setViewState(prev => ({ ...prev, toastMessage: null }))}
          />
        </div>
      )}

      {/* AI Reply Dialog */}
      <Modal
        isOpen={!!activeReviewForReply}
        onClose={() => setViewState(prev => ({ ...prev, activeReviewForReply: null }))}
        title={activeReviewForReply ? `AI Response for ${activeReviewForReply.guestName}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewState(prev => ({ ...prev, activeReviewForReply: null }))} disabled={isGeneratingReply}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendReply} disabled={isGeneratingReply}>
              {isGeneratingReply ? "Generating..." : "Copy & Send Reply"}
            </Button>
          </>
        }
      >
        {activeReviewForReply && (
          <div className="space-y-4">
            <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
              <strong>Guest Review:</strong>
            </p>
            <blockquote className="p-3.5 bg-(--color-surface-muted)/30 dark:bg-(--color-surface-muted-dark)/20 border-l-4 border-(--color-brand-400) rounded-r-xl italic text-xs leading-relaxed">
              &ldquo;{activeReviewForReply.text}&rdquo;
            </blockquote>
            
            <div className="flex items-center gap-1.5 mt-4">
              <Sparkles size={14} className={`text-(--color-brand-500) ${isGeneratingReply ? "animate-spin" : "animate-pulse-soft"}`} />
              <span className="text-xs font-semibold text-(--color-brand-600) dark:text-white">
                {isGeneratingReply ? "Gemini AI is generating reply..." : "Recommended Draft response:"}
              </span>
            </div>
            
            <textarea
              aria-label="Recommended Draft Response Text"
              className="w-full h-28 p-3.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-xs outline-none focus:ring-2 focus:ring-(--color-brand-400)/20 focus:border-(--color-brand-400) transition-all resize-none text-(--color-brand-600) dark:text-white leading-relaxed"
              value={draftReplyText}
              disabled={isGeneratingReply}
              onChange={(e) => setViewState(prev => ({ ...prev, draftReplyText: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Reviews</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Search and browse guest feedback</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-(--color-muted) dark:text-(--color-muted-dark) widget-card px-3.5 py-2 rounded-xl">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-(--color-brand-400)" />
            {positive} positive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {negative} negative
          </span>
          <span className="font-semibold text-(--color-brand-500) dark:text-(--color-brand-400)">
            {activeTab === "inbox" ? inboxCount : spamCount} total
          </span>
        </div>
      </div>

      {/* Tabs - Inbox vs Spam */}
      <div className="flex border-b border-(--color-border) dark:border-(--color-border-dark) mb-6 gap-6 relative z-10">
        <button
          type="button"
          onClick={() => setViewState(prev => ({ ...prev, activeTab: "inbox" }))}
          className={`pb-3 text-sm font-semibold transition-all cursor-pointer relative ${
            activeTab === "inbox"
              ? "text-(--color-brand-600) dark:text-white border-b-2 border-(--color-brand-500)"
              : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500)"
          }`}
        >
          Inbox ({inboxCount})
        </button>
        <button
          type="button"
          onClick={() => setViewState(prev => ({ ...prev, activeTab: "spam" }))}
          className={`pb-3 text-sm font-semibold transition-all cursor-pointer relative flex items-center gap-1.5 ${
            activeTab === "spam"
              ? "text-red-500 border-b-2 border-red-500"
              : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-red-500"
          }`}
        >
          Flagged Spam ({spamCount})
          {spamCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-red-500/10 text-red-500 font-bold border border-red-500/20 animate-pulse-soft">
              {spamCount}
            </span>
          )}
        </button>
      </div>

      <div className="max-w-md mb-6">
        <Input
          value={search}
          onChange={(e) => setViewState(prev => ({ ...prev, search: e.target.value }))}
          placeholder={activeTab === "inbox" ? "Search inbox reviews..." : "Search flagged spam reviews..."}
          icon={<Search size={16} />}
          fullWidth
        />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-(--color-brand-100) dark:bg-(--color-brand-800) flex items-center justify-center mx-auto mb-4">
            {activeTab === "inbox" ? (
              <MessageSquareText size={20} className="text-(--color-brand-400)" />
            ) : (
              <ShieldAlert size={20} className="text-red-400" />
            )}
          </div>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
            {activeTab === "inbox" ? "No reviews match your search." : "No flagged spam reviews detected."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <ReviewCard
              key={r.id}
              review={r}
              onReply={handleOpenReplyModal}
              onDelete={handleDelete}
              onUnflag={handleUnflag}
            />
          ))}
        </div>
      )}
    </>
  )
}
