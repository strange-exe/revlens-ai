# Week 7 — Deliverable 4: Peer Code Reviews
**Intern Name**: Abhinesh Gangwar
**Intern ID**: TBI-26100587

---

## Peer Review 1: Student Repository A (FastAPI & React AI App)

### 1. Architectural Observation
The repository follows a clean modular structure separating FastAPI backend services (`/app/routers`, `/app/services`) from React frontend components. The OpenAI API integration is isolated within a dedicated service layer, which keeps business logic decoupled from HTTP request handling.

### 2. Specific Code Suggestion
In `backend/services/ai_service.py`, the OpenAI API call is wrapped in a generic `try-except Exception` block. I recommend catching specific `openai.error.RateLimitError` and `openai.error.APIError` exceptions explicitly to provide custom 429 and 503 HTTP responses to the frontend instead of generic 500 errors.

### 3. Technical Question
Have you considered implementing a client-side or server-side cache (such as Redis or in-memory LRU) for repetitive AI prompts to reduce API latency and lower OpenAI token costs?

---

## Peer Review 2: Student Repository B (Node.js & Next.js AI Assistant)

### 1. Architectural Observation
Great use of Next.js Server Actions for handling AI prompt submissions directly. The environment variable security is well maintained, with `OPENAI_API_KEY` kept strictly on the server side and excluded from the public client bundle.

### 2. Specific Code Suggestion
In `components/AIChat.tsx`, the loading spinner state relies on a single boolean state variable without a timeout fallback. If the backend API hangs or times out after 30 seconds, the UI spinner runs indefinitely. Adding an `AbortController` timeout would improve UX error handling.

### 3. Technical Question
How are you managing prompt token limits when long conversation threads are passed back to the model?
