# Week 9 — Deliverable 3: Peer Testing Feedback
**Intern Name**: Abhinesh Gangwar
**Intern ID**: TBI-26100587

---

## Peer App 1: Student App A (Live URL Test)

- **What works well**: The live application home page loads extremely fast on Vercel. User registration and login flow works seamlessly, returning a valid JWT token and redirecting to the authenticated dashboard without latency.
- **Bug / Issue Found**: When submitting an empty search query on the task list page, the UI renders an unhandled React error stating `Cannot read property 'map' of undefined`. 
- **Steps to reproduce**: 
  1. Log into the app.
  2. Navigate to the Tasks tab.
  3. Type a single space in the search bar and press Enter.

---

## Peer App 2: Student App B (Live URL Test)

- **What works well**: The AI generation feature on the live Render backend produces high quality, well-formatted summaries in under 2 seconds. The dark mode toggle and responsive mobile navigation work great at 375px resolution.
- **Bug / Issue Found**: On the profile edit modal, submitting an updated name without changing the email returns a CORS preflight error on Chrome DevTools (`Access-Control-Allow-Origin` missing on `PUT /api/user/profile`).
- **Steps to reproduce**:
  1. Open Chrome DevTools Network tab.
  2. Go to Profile Settings → Edit Name → Click Save.
  3. Observe CORS error in console log.
