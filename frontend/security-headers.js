// Security headers for Cloudflare Pages, generated at build time so the CSP always matches the built index.html.
//
// Writes dist/_headers (https://developers.cloudflare.com/pages/configuration/headers/) and applies the same
// headers to `vite preview`, so the policy can be tested locally before it ships. Inline <script>s (the theme
// script that prevents a flash of the wrong theme) are allowed by their SHA-256 hash, never by 'unsafe-inline'.
//
// CSP_ENFORCE=1 makes production enforce the policy; otherwise it ships as Content-Security-Policy-Report-Only,
// which only reports violations in the browser console. Preview always enforces, so local testing is strict.
import { createHash } from "node:crypto"
import { readFileSync, existsSync, writeFileSync } from "node:fs"
import { resolve } from "node:path"

const API_ORIGIN = "https://api.revlens.abhinesh.codes"

// Sign in with Google: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid (CSP section)
// Cloudflare Web Analytics injects its beacon from static.cloudflareinsights.com and reports to cloudflareinsights.com
function cspFor(scriptHashes) {
  const hashes = scriptHashes.map((h) => `'sha256-${h}'`).join(" ")
  return [
    "default-src 'self'",
    `script-src 'self' ${hashes} https://accounts.google.com/gsi/client https://static.cloudflareinsights.com`,
    // style attributes (React style={{...}}) need 'unsafe-inline' for styles; scripts stay strict
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
    "img-src 'self' data: https://*.googleusercontent.com",
    "font-src 'self'",
    `connect-src 'self' ${API_ORIGIN} https://accounts.google.com/gsi/ https://cloudflareinsights.com`,
    "frame-src https://accounts.google.com/gsi/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ")
}

function inlineScriptHashes(html) {
  return [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)]
    // Browsers hash the script text after HTML newline normalisation (CRLF and CR become LF), so hash that,
    // not the file's raw bytes: index.html is checked out with CRLF on Windows
    .map((m) => m[1].replace(/\r\n?/g, "\n"))
    .filter((body) => body.trim())
    .map((body) => createHash("sha256").update(body, "utf8").digest("base64"))
}

export function headersFor(html, { enforce }) {
  return {
    [enforce ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only"]: cspFor(inlineScriptHashes(html)),
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    // Google's guidance for its sign-in popup when FedCM is off
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  }
}

export default function securityHeaders() {
  let outDir = "dist"
  return {
    name: "revlens-security-headers",
    configResolved(config) {
      outDir = resolve(config.root, config.build.outDir)
    },
    // After the files are written: hash the inline scripts of index.html exactly as served (an earlier hook saw
    // an intermediate version of the HTML and produced a hash the browser rejected)
    writeBundle() {
      const file = resolve(outDir, "index.html")
      if (!existsSync(file)) return
      const html = readFileSync(file, "utf8")
      const lines = Object.entries(headersFor(html, { enforce: process.env.CSP_ENFORCE === "1" }))
        .map(([name, value]) => `  ${name}: ${value}`)
      const source = [
        "/*", ...lines,
        // Content-hashed files never change: cache them for a year. HTML keeps Pages' default (revalidate).
        "/assets/*", "  Cache-Control: public, max-age=31536000, immutable", "",
      ].join("\n")
      writeFileSync(resolve(outDir, "_headers"), source)
    },
    configurePreviewServer(server) {
      const file = resolve(outDir, "index.html")
      if (!existsSync(file)) return
      const headers = headersFor(readFileSync(file, "utf8"), { enforce: true })
      server.middlewares.use((_req, res, next) => {
        for (const [name, value] of Object.entries(headers)) res.setHeader(name, value)
        next()
      })
    },
  }
}
