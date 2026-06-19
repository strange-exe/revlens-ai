/**
 * Spam and Bot Review Filter for RevLens AI
 */

export function detectSpam(text, guestName = "") {
  if (!text) return { isSpam: false, reason: "" };

  // Rule 1: Link/URL check (Russian domains, xyz, promo links)
  const urlRegex = /https?:\/\/[^\s]+|www\.[^\s]+|\b[a-zA-Z0-9-]+\.(ru|xyz|tk|click|info|biz|club)\b/i;
  if (urlRegex.test(text)) {
    return { isSpam: true, reason: "Promotional links detected" };
  }

  // Rule 2: Blacklisted words (promotional spam)
  const blacklist = [
    /\bget\s+\d+%\s+off\b/i,
    /\bamazing\s+discounts?\b/i,
    /\bclick\s+here\b/i,
    /\bfree\s+promo\b/i,
    /\bcheap\s+hotel\b/i
  ];
  for (const regex of blacklist) {
    if (regex.test(text)) {
      return { isSpam: true, reason: "Promotional content pattern matched" };
    }
  }

  // Rule 3: Gibberish/Keyboard smash
  // Check for 6+ consecutive consonants (indicative of keyboard smash like asdfgh, qwert, zxcvb)
  const consonantSmash = /[bcdfghjklmnpqrstvwxyz]{6,}/i;
  if (consonantSmash.test(text.replace(/\s+/g, ""))) {
    return { isSpam: true, reason: "Nonsense gibberish/keyboard smash detected" };
  }

  // Rule 4: Repetitive text (bot-like duplication)
  const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
  const uniqueSentences = new Set(sentences);
  if (sentences.length > 1 && uniqueSentences.size <= sentences.length / 2) {
    return { isSpam: true, reason: "High rate of duplicated sentences (bot pattern)" };
  }

  // Rule 5: Bot-like guest name
  const botNameRegex = /Bot$|DealsBot$|\b[a-zA-Z]+\d{4,}\b/i;
  if (botNameRegex.test(guestName)) {
    return { isSpam: true, reason: "Suspicious bot username signature" };
  }

  return { isSpam: false, reason: "" };
}
