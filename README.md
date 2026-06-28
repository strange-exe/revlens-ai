# RevLens AI

    AI-powered review intelligence platform for homestay owners.

## Overview

    RevLens AI helps homestay owners analyze guest reviews, classify sentiment, identify recurring themes, and generate actionable insights through AI-powered analytics and visual dashboards.

    The platform centralizes feedback from multiple review sources and transforms unstructured reviews into meaningful business intelligence. Using Google's Gemini API, RevLens AI can automatically classify sentiment, detect key themes, suggest professional responses, and visualize trends through an interactive analytics dashboard.

## Features

* Review sentiment analysis
* Theme detection
* AI-generated management responses
* Analytics dashboard
* Review trend tracking
* Bulk review processing

## Tech Stack

### Frontend

* React.js (Vite)
* Tailwind CSS

### Backend

* FastAPI

### Database

* Supabase

### AI Integration

* Google Gemini API

### Authentication

* JWT Authentication

### Deployment

* Cloudflare Pages
* Railway

## Setup

### Backend API Setup

This is the backend REST API for RevLens AI, built using FastAPI

## Features
- **FastAPI Framework**: High performance, easy routing, automatic OpenAPI (Swagger) documentation.
- **SQLAlchemy ORM**: Flexible database query building with PostgreSQL or SQLite.
- **Seeding on Startup**: Auto-creates database tables and seeds them with mock reviews and properties on first launch.
- **Error Handling Middleware**: Catch-all global middleware returning formatted JSON responses for 404, 400, and 500 errors.

---

## How to Run Backend Locally

### Prerequisites
- Python 3.10 or higher
- pip (Python package installer)

### Setup Instructions

1. **Navigate to the Backend Directory**:
   ```bash
   cd backend
   ```

2. **Create and Activate a Virtual Environment**:
   - **Windows (PowerShell)**:
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```
   - **macOS/Linux**:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   - **Windows**:
     ```powershell
     copy .env.example .env
     ```
   - **macOS/Linux**:
     ```bash
     cp .env.example .env
     ```
   Open `.env` and fill in your custom configurations, including your `GEMINI_API_KEY` for AI features.

5. **Run the Development Server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   The backend API will start running at `http://localhost:8000`.

6. **Access Interactive API Docs**:
   - Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

---

## API Endpoints Summary

### Properties Endpoints
- `GET /api/properties`: List all registered properties.
- `POST /api/properties`: Register a new property.

### Reviews Endpoints
- `GET /api/reviews`: Get all reviews (supports optional filter queries `property_id` and `sentiment`).
- `GET /api/reviews/{review_id}`: Get details of a single review.
- `POST /api/reviews`: Create a new guest review.
- `PUT /api/reviews/{review_id}`: Update review details.
- `PATCH /api/reviews/{review_id}/flag`: Toggle spam/unflag state.
- `DELETE /api/reviews/{review_id}`: Delete a review.

### Additional Endpoints
- `GET /api/reviews/search`: Search reviews text, guest names, or property names by query parameter `q`.
- `GET /api/reviews/sentiment-summary`: Aggregated counts of positive, neutral, and negative reviews.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   The application will load at `http://localhost:5173`.