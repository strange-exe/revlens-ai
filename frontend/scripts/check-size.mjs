// Bundle size budget: gzip size of the JS every first visit downloads (entry + preloaded chunks),
// plus a per-chunk report. Run after `vite build`: `npm run size`. Fails (exit 1) over budget.
import fs from "node:fs"
import path from "node:path"
import zlib from "node:zlib"

const BUDGET_INITIAL_JS_KB = 90   // gzip; raise only deliberately
const BUDGET_ANY_ROUTE_CHUNK_KB = 15

const dist = path.resolve(import.meta.dirname, "../dist")
const html = fs.readFileSync(path.join(dist, "index.html"), "utf8")
const initial = [...html.matchAll(/(?:src|href)="\/?(assets\/[^"]+\.js)"/g)].map((m) => m[1])
const gz = (file) => zlib.gzipSync(fs.readFileSync(path.join(dist, file)), { level: 9 }).length / 1024

const chunks = fs.readdirSync(path.join(dist, "assets")).filter((f) => f.endsWith(".js"))
  .map((f) => ({ file: `assets/${f}`, kb: gz(`assets/${f}`) })).sort((a, b) => b.kb - a.kb)
const initialKb = initial.reduce((sum, f) => sum + gz(f), 0)

for (const c of chunks) {
  console.log(`${c.kb.toFixed(1).padStart(6)} KB  ${initial.includes(c.file) ? "initial" : "lazy   "}  ${c.file}`)
}
console.log(`\ninitial JS (gzip): ${initialKb.toFixed(1)} KB / budget ${BUDGET_INITIAL_JS_KB} KB`)

const failures = []
if (initialKb > BUDGET_INITIAL_JS_KB) failures.push(`initial JS ${initialKb.toFixed(1)} KB > ${BUDGET_INITIAL_JS_KB} KB`)
for (const c of chunks) {
  if (!initial.includes(c.file) && c.kb > BUDGET_ANY_ROUTE_CHUNK_KB) failures.push(`${c.file} ${c.kb.toFixed(1)} KB > ${BUDGET_ANY_ROUTE_CHUNK_KB} KB`)
}
if (failures.length) {
  console.error("\nSIZE BUDGET EXCEEDED:\n  " + failures.join("\n  "))
  process.exit(1)
}
