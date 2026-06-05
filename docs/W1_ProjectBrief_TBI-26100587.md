# RevLens AI Project Brief

## App Name

    RevLens AI

## One-Line Pitch

    An AI-powered review intelligence platform that helps homestay owners analyze guest feedback and make data-driven service improvements.

## Target User

    RevLens AI is designed for homestay owners, managers, and hospitality staff who receive guest reviews across platforms such as Google, Booking.com, TripAdvisor, and social media. They need a centralized way to understand customer sentiment, identify recurring issues, track service quality, and respond efficiently without manually reading large volumes of reviews.

## Core Features

### Review Analysis

    Analyze individual or bulk guest reviews from multiple sources.

### Sentiment Classification

    Categorize reviews as Positive, Neutral, or Negative.

### Theme Detection

    Identify key topics such as Food, Host, Location, Cleanliness, Value, and Experience.

### Suggested Responses

    Generate professional management responses for guest reviews.

### Analytics Dashboard

    Visualize sentiment distribution, recurring themes, and feedback trends through interactive charts and summary insights.

## AI Feature

    The platform uses the Google Gemini API to classify sentiment, identify themes, and generate suggested management responses. Gemini was selected for its strong natural language understanding, structured JSON output capabilities, fast response times, and accessible free tier for rapid prototyping.

## Tech Stack

**Frontend:** React.js (Vite)

**Styling:** Tailwind CSS

**Backend:** Cloudflare Workers

**Database:** Cloudflare D1

**Authentication:** JWT Authentication

**AI Integration:** Google Gemini API

**Deployment:** Cloudflare Pages (Frontend) + Cloudflare Workers (Backend)
