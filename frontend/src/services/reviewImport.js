// Turn pasted spreadsheet rows or a CSV file into reviews ready to import.
// Pure functions (no React), so the rules are unit-tested in reviewImport.test.js.

export const SOURCES = ["Airbnb", "Booking.com", "Google", "TripAdvisor", "MakeMyTrip", "Agoda", "Other"]
export const MAX_IMPORT_ROWS = 500

// Header names hosts actually use, per field (compared lower-case, punctuation removed)
const HEADERS = {
  guest: ["guest", "guest name", "name", "reviewer", "reviewer name", "author", "user"],
  rating: ["rating", "stars", "star rating", "score", "overall", "overall rating"],
  text: ["review", "text", "review text", "comment", "comments", "body", "content", "feedback"],
  date: ["date", "review date", "stay date", "date of stay", "posted", "published", "created"],
  source: ["source", "platform", "site", "channel", "website"],
}
const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]

/** Split CSV/TSV text into rows of cells. Handles quoted cells with delimiters, quotes ("") and newlines. */
export function splitRows(input) {
  const text = input.replace(/^\uFEFF/, "") // Excel's byte-order mark
  const firstLine = text.split(/\r?\n/, 1)[0]
  const delimiter = firstLine.includes("\t") ? "\t" : firstLine.split(";").length > firstLine.split(",").length ? ";" : ","
  const rows = []
  let row = [], cell = "", quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"' && cell === "") quoted = true
    else if (ch === delimiter) { row.push(cell); cell = "" }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++
      row.push(cell); rows.push(row); row = []; cell = ""
    } else cell += ch
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row) }
  return rows.map((r) => r.map((c) => c.trim())).filter((r) => r.some((c) => c !== ""))
}

const normalizeHeader = (h) => h.toLowerCase().replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim()

/** Which column holds which field, or null when the first row isn't a recognisable header. */
export function mapColumns(header) {
  const names = header.map(normalizeHeader)
  const columns = {}
  for (const [field, aliases] of Object.entries(HEADERS)) {
    const index = names.findIndex((n) => aliases.includes(n))
    if (index !== -1) columns[field] = index
  }
  return "text" in columns && "rating" in columns ? columns : null
}

/** "4", "4.5", "4/5", "8/10", "★★★★☆" -> 1..5, or null. A bare number above 5 can only be a 0-10 score;
 * `outOfTen` (Booking.com rows) makes low bare numbers like "4" count as 4/10 too. */
export function parseRating(raw, outOfTen = false) {
  const value = String(raw ?? "").trim()
  if (!value) return null
  const stars = (value.match(/★/g) || []).length
  if (stars) return stars
  const fraction = value.match(/^(\d+(?:\.\d+)?)\s*\/\s*(5|10)$/)
  let n = fraction ? Number(fraction[1]) * (5 / Number(fraction[2])) : Number(value.replace(",", "."))
  if (!fraction && (outOfTen || n > 5)) n /= 2
  if (!Number.isFinite(n) || n <= 0 || n > 5) return null
  return Math.max(1, Math.round(n))
}

const pad = (n) => String(n).padStart(2, "0")
const iso = (y, m, d) => {
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? `${y}-${pad(m)}-${pad(d)}` : null
}

/** Dates as hosts paste them -> "YYYY-MM-DD", or null. Numeric dates are day-first (DD/MM/YYYY), as in India. */
export function parseDate(raw) {
  const value = String(raw ?? "").trim().toLowerCase()
  if (!value) return null
  let m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return iso(+m[1], +m[2], +m[3])
  m = value.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/)
  if (m) return iso(+m[3], +m[2], +m[1])
  const month = (word) => MONTHS.indexOf(word.slice(0, 3)) + 1
  m = value.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)\.?,?\s+(\d{4})$/) // 5 Oct 2026
  if (m && month(m[2])) return iso(+m[3], month(m[2]), +m[1])
  m = value.match(/^([a-z]+)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/) // October 5, 2026
  if (m && month(m[1])) return iso(+m[3], month(m[1]), +m[2])
  m = value.match(/^([a-z]+)\.?,?\s+(\d{4})$/) // October 2026 (Airbnb shows month + year)
  if (m && month(m[1])) return iso(+m[2], month(m[1]), 1)
  return null
}

const SOURCE_ALIASES = { "booking": "Booking.com", "booking com": "Booking.com", "google reviews": "Google", "google maps": "Google",
  "tripadvisor": "TripAdvisor", "trip advisor": "TripAdvisor", "makemytrip": "MakeMyTrip", "mmt": "MakeMyTrip" }
function normalizeSource(raw, fallback) {
  const value = String(raw ?? "").trim()
  if (!value) return fallback
  const known = SOURCES.find((s) => s.toLowerCase() === value.toLowerCase())
  return known || SOURCE_ALIASES[normalizeHeader(value)] || value.slice(0, 40)
}

export const dedupeKey = (text) => text.toLowerCase().split(/\s+/).filter(Boolean).join(" ")

/**
 * Parse pasted/uploaded text into rows: { line, guest, rating, text, date, source, errors[], duplicate }.
 * `existingTexts`: review texts already on the property, so re-imports are flagged before sending.
 */
export function parseImport(input, { defaultSource = "Other", existingTexts = [] } = {}) {
  const rows = splitRows(input)
  if (rows.length === 0) return { rows: [], error: "Nothing to import yet. Paste rows or choose a CSV file." }
  const columns = mapColumns(rows[0])
  if (!columns) {
    return { rows: [], error: "The first row must be a header naming at least a review text column (e.g. \"Review\") and a rating column (e.g. \"Rating\")." }
  }
  const body = rows.slice(1)
  if (body.length > MAX_IMPORT_ROWS) return { rows: [], error: `That's ${body.length} rows; import at most ${MAX_IMPORT_ROWS} at a time.` }
  const seen = new Set(existingTexts.map(dedupeKey))
  const parsed = body.map((cells, i) => {
    const get = (field) => (field in columns ? (cells[columns[field]] ?? "").trim() : "")
    const text = get("text")
    const source = normalizeSource(get("source"), defaultSource)
    // Scale per row: pastes mix platforms, and only Booking.com scores out of 10
    const rating = parseRating(get("rating"), source === "Booking.com")
    const date = parseDate(get("date"))
    const errors = []
    if (!text) errors.push("missing review text")
    else if (text.length > 5000) errors.push("review is longer than 5,000 characters")
    if (rating === null) errors.push(get("rating") ? `rating "${get("rating")}" isn't 1–5 stars` : "missing rating")
    if (date === null) errors.push(get("date") ? `date "${get("date")}" not recognised` : "missing date")
    const key = dedupeKey(text)
    const duplicate = errors.length === 0 && seen.has(key)
    if (errors.length === 0) seen.add(key)
    return {
      line: i + 2, // spreadsheet row number (the header is row 1)
      guest: (get("guest") || "Guest").slice(0, 120),
      rating, text, date,
      source,
      errors, duplicate,
    }
  })
  return { rows: parsed, error: null }
}
