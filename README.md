# RevLens AI

> AI-powered review intelligence platform empowering homestay owners to analyze guest reviews, track sentiment, automate responses, and extract actionable business insights.

---

## 🔗 Live Links & Demo

- **Live Application URL**: [https://revlens.abhinesh.me](https://revlens.abhinesh.me)
- **Live Backend API**: [https://revlens-backend.onrender.com/](https://revlens-backend.onrender.com/)
- **Interactive API Documentation (Swagger)**: [https://revlens-backend.onrender.com/docs](https://revlens-backend.onrender.com/docs)
---

## 🖼️ Screenshots

![Login Page](screenshots/1_login.png)
*Figure 1: User Login & JWT Authentication Interface*

![Dashboard & Reviews](screenshots/2_read.png)
*Figure 2: Real-time Analytics Dashboard & Guest Review Feed*

![AI Response Generation](screenshots/ai_reply_verification.png)
*Figure 3: AI-Generated Guest Management Response powered by Google Gemini API*

![Create Property & Review](screenshots/3_create.png)
*Figure 4: Property Registration & Review Submission Flow*

---

## ✨ Features

- **Guest Review Sentiment Analysis**: Automatically classifies incoming reviews into `positive`, `neutral`, or `negative` categories using Google Gemini AI.
- **Spam & Abuse Detection**: Audits review text for promotional links, repetitive spam patterns, or malicious content.
- **AI-Powered Response Assistant**: Generates warm, professional, on-brand host replies in seconds with customizable tone rules.
- **Property & Review Management (Full CRUD)**: Register homestay properties, add guest reviews, edit existing records, and flag/delete reviews.
- **Analytics & Trend Visualizations**: Real-time breakdown of average ratings, sentiment distributions, and review volume across properties.
- **JWT & OAuth Authentication**: Secure user registration, password hashing with bcrypt, and JWT token protection.
- **Search & Filtering**: Search reviews by guest name, property, or text keywords with real-time dynamic filtering.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 (Vite)
- **Styling**: Tailwind CSS
- **Icons & UI Components**: Lucide React
- **State Management & Data Fetching**: React Context API & Axios

### Backend
- **Framework**: FastAPI (Python 3.12)
- **ORM & Database Drivers**: SQLAlchemy & psycopg2-binary
- **Authentication**: PyJWT & Passlib (bcrypt)
- **API Documentation**: OpenAPI / Swagger UI

### Database & AI Services
- **Database**: PostgreSQL hosted on **Supabase**
- **AI Model Integration**: Google Gemini API (`gemini-1.5-flash`) via HTTP REST requests with local fallback heuristics

### Hosting & Deployment
- **Frontend Hosting**: Vercel
- **Backend Hosting**: Render (Web Service)
- **CI/CD**: GitHub Actions

---

## 📐 Architecture & Folder Structure

```
revlens-ai/
├── backend/                  # FastAPI REST API Backend
│   ├── app/
│   │   ├── ai.py             # Gemini AI integration & fallback prompt logic
│   │   ├── auth.py           # JWT token generation & password hashing
│   │   ├── crud.py           # SQLAlchemy database queries & CRUD operations
│   │   ├── database.py       # Supabase PostgreSQL database engine setup
│   │   ├── main.py           # FastAPI entrypoint, routes, & CORS middleware
│   │   ├── models.py         # SQLAlchemy ORM database models
│   │   └── schemas.py        # Pydantic data validation schemas
│   ├── requirements.txt      # Python backend dependencies
│   └── main.py               # Root app loader
├── frontend/                 # React (Vite) Frontend Application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Cards, Modals, Loader)
│   │   ├── context/          # Auth & Property Context Providers
│   │   ├── pages/            # Application routes (Dashboard, Properties, Reviews, Assistant)
│   │   ├── services/         # API client & HTTP request handlers
│   │   ├── App.jsx           # Main React router & layout wrapper
│   │   └── main.jsx          # Vite entrypoint
│   └── package.json          # Frontend dependencies & scripts
├── docs/                     # Project briefs & architectural documentation
├── screenshots/              # Application screenshots for documentation & submission
├── PROMPTS.md                # Prompt engineering log & iteration analysis
└── README.md                 # Complete project capstone documentation
```

### Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users {
        int id PK
        string email UNIQUE
        string hashed_password
        string full_name
        string google_id UNIQUE
        string picture
    }
    properties {
        int id PK
        string name
        string location
        string price
        string distance
        float rating
        int reviews_count
        boolean is_user_property
        int user_id FK
    }
    reviews {
        int id PK
        int property_id FK
        string property_name
        string guest_name
        int rating
        string text
        string date
        string sentiment
        string source
        boolean is_spam
        boolean is_unflagged
        string response
    }
    users ||--o{ properties : "owns"
    properties ||--o{ reviews : "has"
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm
- Free Supabase PostgreSQL instance
- Google Gemini API Key ([AI Studio](https://aistudio.google.com/))

### 2. Backend Setup
```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\Activate.ps1

# Install requirements
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
```

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
JWT_SECRET=your_super_secret_jwt_key_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440
GEMINI_API_KEY=your_google_gemini_api_key_here
```

Start the FastAPI backend:
```bash
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`. Access Swagger docs at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```
Frontend will load at `http://localhost:5173`.

---

## 📋 API Endpoints Documentation

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new homestay host account | No |
| `POST` | `/api/auth/login` | Obtain JWT access token via email & password | No |
| `POST` | `/api/auth/google` | Authenticate via Google OAuth ID token | No |
| `GET` | `/api/auth/me` | Fetch authenticated host profile | Yes |
| `GET` | `/api/properties` | Fetch registered properties | Yes |
| `POST` | `/api/properties` | Create a new property | Yes |
| `GET` | `/api/reviews` | List guest reviews (filterable by property & sentiment) | Yes |
| `GET` | `/api/reviews/search` | Search review text, guest names, or properties | Yes |
| `POST` | `/api/reviews` | Submit a new guest review | Yes |
| `POST` | `/api/reviews/{id}/generate-reply` | Generate AI host response via Gemini API | Yes |
| `PUT` | `/api/reviews/{id}` | Update review content | Yes |
| `PATCH` | `/api/reviews/{id}/flag` | Flag or unflag review as spam | Yes |
| `DELETE` | `/api/reviews/{id}` | Delete a review | Yes |
| `GET` | `/api/reviews/sentiment-summary` | Aggregated positive/neutral/negative counts | Yes |

---

## ⚠️ Known Limitations & Deployment Notes

- **Render Free Tier Cold Start**: The backend hosted on Render's free web service spins down after 15 minutes of inactivity. Initial requests after idle may take 30–50 seconds to wake up the server.
- **Gemini API Quota**: Free tier Gemini API rate limits permit up to 15 requests per minute. If exceeded, RevLens AI automatically falls back to built-in rule-based sentiment and mock response engines to ensure uninterrupted service.

---

## Credits & Acknowledgements

- **Google Gemini API** for generative text capabilities and review sentiment modeling.
- **Supabase** for managed PostgreSQL cloud hosting.
- **TBI GEU Internship Program (SIP26)** for curriculum modules, technical mentorship, and evaluation guidelines.