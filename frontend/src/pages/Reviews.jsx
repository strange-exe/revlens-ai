import React, { useState, useMemo, useEffect } from "react"
import ReviewCard from "../components/ReviewCard"
import { MessageSquareText, Search, Sparkles, ShieldAlert } from "lucide-react"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import Modal from "../components/ui/Modal"
import AnimatedTabs from "../components/fx/AnimatedTabs"
import Toast from "../components/ui/Toast"
import { isSpamReview } from "../services/reviewFilters"
import { useProperty } from "../context/PropertyContext"
import PageSkeleton from "../components/ui/Skeleton"

// Where the draft came from (backend `source`), so a template is never mistaken for an AI reply
const DRAFT_LABELS = {
  llm: "AI draft: review it before sending",
  template: "Template draft",
  error: "No draft available: write your reply below",
}

export default function Reviews() {
  const { reviews, selectedPropertyId, unflagReview, deleteReview, loading, error, updateReviewResponse, generateReply } = useProperty()

  const [viewState, setViewState] = useState({
    activeTab: "inbox", // "inbox" or "spam"
    search: "",
    activeReviewForReply: null,
    draftReplyText: "",
    draftSource: null, // "llm" | "template" | "error"
    isGeneratingReply: false,
    toastMessage: null
  })

  const { activeTab, search, activeReviewForReply, draftReplyText, draftSource, isGeneratingReply, toastMessage } = viewState

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
    return propertyReviews.filter((r) => !(isSpamReview(r))).length
  }, [propertyReviews])

  const spamCount = useMemo(() => {
    return propertyReviews.filter((r) => isSpamReview(r)).length
  }, [propertyReviews])

  const filtered = useMemo(() => {
    return propertyReviews.filter((r) => {
      // 1. Tab filter
      const isSpam = isSpamReview(r)
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
    return filtered.filter((r) => r.sentiment === "positive" && !(isSpamReview(r))).length
  }, [filtered])

  const negative = useMemo(() => {
    return filtered.filter((r) => r.sentiment === "negative" && !(isSpamReview(r))).length
  }, [filtered])

  if (loading) return <PageSkeleton label="Loading reviews" variant="list" />

  const handleOpenReplyModal = async (review) => {
    setViewState(prev => ({
      ...prev,
      activeReviewForReply: review,
      draftReplyText: "",
      draftSource: null,
      isGeneratingReply: true
    }))

    try {
      const { reply, source } = await generateReply(review.id)
      setViewState(prev => {
        if (prev.activeReviewForReply?.id !== review.id) return prev
        return { ...prev, draftReplyText: reply, draftSource: source, isGeneratingReply: false }
      })
    } catch (err) {
      // No invented fallback text: a canned reply could mention problems the guest never raised
      setViewState(prev => {
        if (prev.activeReviewForReply?.id !== review.id) return prev
        return {
          ...prev,
          draftReplyText: "",
          draftSource: "error",
          isGeneratingReply: false,
          toastMessage: { text: `Couldn't generate a draft (${err.message || "network error"}). You can write the reply yourself.`, type: "error" }
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
        // RevLens doesn't post to Airbnb/Booking.com: it saves the reply and copies it for the host to paste
        toastMessage: { text: `Reply to ${activeReviewForReply.guestName} saved and copied. Paste it on the review platform.`, type: "success" },
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
        title={activeReviewForReply ? `Reply to ${activeReviewForReply.guestName}` : ""}
        footer={
          <>
            <Button variant="ghost" onClick={() => setViewState(prev => ({ ...prev, activeReviewForReply: null }))} disabled={isGeneratingReply}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSendReply} disabled={isGeneratingReply || !draftReplyText.trim()}>
              {isGeneratingReply ? "Generating..." : "Save & Copy Reply"}
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
              <Sparkles size={14} className={`text-(--color-brand-500) ${isGeneratingReply ? "animate-spin" : ""}`} />
              <span className="text-xs font-semibold text-(--color-ink) dark:text-white">
                {isGeneratingReply ? "Generating a draft..." : DRAFT_LABELS[draftSource] ?? "Draft:"}
              </span>
            </div>
            {draftSource === "template" && !isGeneratingReply && (
              <p className="text-[11px] text-amber-700 dark:text-amber-400 -mt-2">
                The AI was unavailable, so this is a generic template. Edit it to respond to what the guest actually said.
              </p>
            )}

            <textarea
              aria-label="Reply text"
              placeholder="Write your reply to the guest..."
              className="w-full h-28 p-3.5 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-elevated-dark) text-xs outline-none focus:ring-2 focus:ring-(--color-brand-400)/20 focus:border-(--color-brand-400) transition-all resize-none text-(--color-ink) dark:text-white leading-relaxed"
              value={draftReplyText}
              disabled={isGeneratingReply}
              onChange={(e) => setViewState(prev => ({ ...prev, draftReplyText: e.target.value }))}
            />
          </div>
        )}
      </Modal>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-ink) dark:text-white">Reviews</h1>
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
      <div className="mb-6 relative z-10">
        <AnimatedTabs
          label="Review folders"
          idPrefix="reviews-tab"
          value={activeTab}
          onChange={(tab) => setViewState(prev => ({ ...prev, activeTab: tab }))}
          tabs={[
            { value: "inbox", label: `Inbox (${inboxCount})` },
            { value: "spam", label: `Flagged Spam (${spamCount})` },
          ]}
        />
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

      <div role="tabpanel" id="reviews-panel" aria-labelledby={`reviews-tab-${activeTab}`}>
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
      </div>
    </>
  )
}
