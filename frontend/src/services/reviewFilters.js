// Spam is decided by the backend (`is_spam`); unflagging is the owner's override
export function isSpamReview(review) {
  return review.isSpam && !review.isUnflagged
}
