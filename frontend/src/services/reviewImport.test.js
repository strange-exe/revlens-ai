import { describe, expect, it } from "vitest"
import { parseDate, parseImport, parseRating, splitRows } from "./reviewImport"

describe("splitRows", () => {
  it("reads tab-separated rows pasted from a spreadsheet", () => {
    expect(splitRows("Guest\tRating\tReview\nAsha\t5\tLovely stay")).toEqual([["Guest", "Rating", "Review"], ["Asha", "5", "Lovely stay"]])
  })
  it("handles quoted CSV cells with commas, quotes and line breaks", () => {
    const csv = 'Guest,Rating,Review\r\nRavi,4,"Clean, quiet ""hidden gem""\nwould return"\r\n'
    expect(splitRows(csv)).toEqual([["Guest", "Rating", "Review"], ["Ravi", "4", 'Clean, quiet "hidden gem"\nwould return']])
  })
  it("detects semicolon CSV (European Excel) and ignores the byte-order mark and blank lines", () => {
    expect(splitRows("\uFEFFGuest;Rating;Review\n\nMeera;3;OK\n")).toEqual([["Guest", "Rating", "Review"], ["Meera", "3", "OK"]])
  })
})

describe("parseRating", () => {
  it.each([["5", 5], ["4.5", 5], ["4/5", 4], ["8/10", 4], ["★★★☆☆", 3], ["3,6", 4]])("%s -> %i", (raw, want) => {
    expect(parseRating(raw)).toBe(want)
  })
  it("scales a 0-10 column", () => expect(parseRating("9", true)).toBe(5))
  it("reads a bare number above 5 as out of ten", () => expect(parseRating("6")).toBe(3))
  it.each(["", "0", "great", "11/10", "12"])("rejects %j", (raw) => expect(parseRating(raw)).toBeNull())
})

describe("parseDate", () => {
  it.each([
    ["2026-10-05", "2026-10-05"], ["05/10/2026", "2026-10-05"], ["5-10-2026", "2026-10-05"], ["5 Oct 2026", "2026-10-05"],
    ["October 5, 2026", "2026-10-05"], ["October 2026", "2026-10-01"], ["Sept. 2026", "2026-09-01"],
  ])("%s -> %s", (raw, want) => expect(parseDate(raw)).toBe(want))
  it.each(["31/02/2026", "yesterday", "", "2026/13/01"])("rejects %j", (raw) => expect(parseDate(raw)).toBeNull())
})

describe("parseImport", () => {
  const paste = "Reviewer\tStars\tComment\tDate\tPlatform\nAsha\t5\tSpotless and calm\t2026-09-01\tbooking\nRavi\t\tNo rating here\t2026-09-02\tAirbnb"
  it("maps header synonyms, normalises platform names and reports per-row errors", () => {
    const { rows, error } = parseImport(paste)
    expect(error).toBeNull()
    // "booking" -> Booking.com, which scores out of 10: its 5 is 5/10, i.e. 3 stars
    expect(rows[0]).toMatchObject({ line: 2, guest: "Asha", rating: 3, date: "2026-09-01", source: "Booking.com", errors: [] })
    expect(rows[1].errors).toEqual(["missing rating"])
  })
  it("treats scores above 5 as out of ten", () => {
    const { rows } = parseImport("Review,Rating,Date\nGood,8,2026-01-01\nGreat,10,2026-01-02")
    expect(rows.map((r) => r.rating)).toEqual([4, 5])
  })
  it("decides the scale per row when platforms are mixed (Booking.com is out of 10, others are stars)", () => {
    const paste = "Review\tRating\tDate\tPlatform\nA\t9\t2026-01-01\tBooking.com\nB\t3\t2026-01-01\tAirbnb\n" +
      "C\t5\t2026-01-01\tGoogle\nD\t4\t2026-01-01\tbooking"
    expect(parseImport(paste).rows.map((r) => r.rating)).toEqual([5, 3, 5, 2])
  })
  it("flags duplicates within the paste and against existing reviews", () => {
    const { rows } = parseImport("Review,Rating,Date\nNice  stay,4,2026-01-01\nnice stay,4,2026-01-02\nNew one,3,2026-01-03",
      { existingTexts: ["New ONE"] })
    expect(rows.map((r) => r.duplicate)).toEqual([false, true, true])
  })
  it("uses the chosen platform and a placeholder guest when those columns are missing", () => {
    const { rows } = parseImport("Review,Rating,Date\nFine,3,2026-01-01", { defaultSource: "Agoda" })
    expect(rows[0]).toMatchObject({ guest: "Guest", source: "Agoda" })
  })
  it("explains what's wrong when there is no usable header", () => {
    expect(parseImport("Asha\t5\tLovely").error).toMatch(/header/)
    expect(parseImport("   ").error).toMatch(/Nothing to import/)
  })
})
