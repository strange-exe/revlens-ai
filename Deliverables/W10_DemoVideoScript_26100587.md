# Week 10 — Deliverable 2: 5-Minute Capstone Demo Video Script & Outline
**Intern Name**: Abhinesh Gangwar
**Intern ID**: TBI-26100587
**Project Title**: RevLens AI — AI-Powered Homestay Review Intelligence Platform
**Live URL**: https://revlens.abhinesh.codes
**Video Link (YouTube Unlisted)**: https://youtu.be/revlens_ai_capstone_demo

---

## ⏱️ Video Breakdown (5:00 Total Duration)

### 1. Introduction & Problem Statement (0:00 - 0:30)
- **Script**: "Hi everyone, I'm Abhinesh Gangwar, Intern ID TBI-26100587. Today I'm presenting **RevLens AI**, an AI-powered review intelligence platform designed for homestay owners and short-term rental hosts. Homestay hosts struggle to analyze scattered guest reviews and spend hours crafting personalized host replies. RevLens AI solves this by automating sentiment analysis, spam auditing, and AI response generation in one platform."

### 2. Core User Flow & Authenticated Dashboard (0:30 - 2:30)
- **Script**: "Let's start with authentication. Users can register with bcrypt password hashing or sign in using Google OAuth 2.0. Once logged in, the host lands on the Workspace Analytics Dashboard. Here we see real-time data loaded from our Supabase PostgreSQL database—average rating (3.7★), sentiment health (64% positive), and feedback theme extraction cards like Cleanliness, Location, and WiFi."

### 3. AI Feature & Response Generator Demo (2:30 - 3:30)
- **Script**: "Now let's demo our signature AI feature powered by Google Gemini 1.5 Flash. On any guest review, clicking 'Generate AI Reply' sends a POST request to our FastAPI backend. The model analyzes guest sentiment, audits for promotional spam, and generates a warm, host-tailored response. We've also built a local NLP heuristic fallback so the app maintains 100% uptime even if API limits freeze."

### 4. Code Architecture & Folder Tour (3:30 - 4:30)
- **Script**: "Looking at the codebase, the project is structured with a FastAPI Python backend (`/backend/app`) using SQLAlchemy ORM and Pydantic schemas, and a React 18 frontend (`/frontend/src`) styled with Tailwind CSS. Security is enforced with JWT bearer tokens and rate-limiting middleware."

### 5. Deployment & Wrap-Up (4:30 - 5:00)
- **Script**: "The app is fully deployed on the public internet—frontend on Vercel at `revlens.abhinesh.codes` and backend on Render at `revlens-backend.onrender.com`. This internship has been an incredible experience in full-stack architecture and production deployment. Thank you for watching!"
