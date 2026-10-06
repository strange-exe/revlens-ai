from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import os
import requests

from . import models, schemas, crud, auth, ai
from .database import get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Schema is managed by Alembic: run `alembic upgrade head` before starting the app

app = FastAPI(
    title="RevLens AI API",
    description="REST API for RevLens AI — Airbnb Review Intelligence Platform",
    version="1.0.0",
)

# Comma-separated list of frontend origins, e.g. "https://revlens.abhinesh.codes"
ALLOWED_ORIGINS = [
    o.strip()
    for o in os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    # Auth uses a Bearer header, not cookies, so credentialed CORS isn't needed
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    ai.load_classifier()
    ai.check_gemini_model()
    db = next(get_db())
    try:
        crud.seed_database(db)
        logger.info("Database initialized and seeded successfully.")
    finally:
        db.close()


# ── Root ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"app": "RevLens AI API", "version": "1.0.0", "status": "running"}


# Rate Limiter helper for Auth endpoints (Week 6 Security Requirement)
from collections import defaultdict
import time
from fastapi import Request

LOGIN_ATTEMPTS = defaultdict(list)

def check_rate_limit(request: Request, max_requests: int = 5, window_seconds: int = 60):
    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    # Filter attempts within the window
    attempts = [t for t in LOGIN_ATTEMPTS[client_ip] if now - t < window_seconds]
    if len(attempts) >= max_requests:
        raise HTTPException(
            status_code=429,
            detail="Too Many Requests. Maximum 5 authentication attempts per minute allowed."
        )
    attempts.append(now)
    LOGIN_ATTEMPTS[client_ip] = attempts


# ── Authentication ────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=201)
def register(user_data: schemas.UserCreate, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)
    existing = crud.get_user_by_email(db, email=user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = auth.hash_password(user_data.password)
    user = crud.create_user(db, user_data, hashed)
    token = auth.create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/api/auth/login", response_model=schemas.TokenResponse, status_code=200)
def login(login_data: schemas.UserLogin, request: Request, db: Session = Depends(get_db)):
    check_rate_limit(request)
    user = crud.get_user_by_email(db, email=login_data.email)
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not auth.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
        
    token = auth.create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/api/auth/google", response_model=schemas.TokenResponse)
def google_auth(req: schemas.GoogleLoginRequest, db: Session = Depends(get_db)):
    # Verify Google token using Google API
    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={req.credential}"
    try:
        response = requests.get(tokeninfo_url, timeout=10)
        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Invalid Google credentials or signature")
        user_info = response.json()
        
        google_id = user_info.get("sub")
        email = user_info.get("email")
        name = user_info.get("name", "")
        picture = user_info.get("picture", "")
        
        if not google_id or not email:
            raise HTTPException(status_code=400, detail="Missing essential token claims")
            
        user = crud.get_or_create_google_user(db, google_id, email, name, picture)
        token = auth.create_access_token(user.email)
        return {"access_token": token, "token_type": "bearer", "user": user}
    except Exception as e:
        logger.error(f"Google login failed: {e}")
        raise HTTPException(status_code=400, detail=f"Google Authentication error: {str(e)}")


@app.get("/api/auth/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

# HEAD is included because uptime monitors (e.g. UptimeRobot) probe with HEAD by default
@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    return {"status": "healthy"}


# ── Properties ────────────────────────────────────────────────────────────

@app.get("/api/properties", response_model=list[schemas.PropertyOut], status_code=200)
def list_properties(db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.get_properties(db, user_id=current_user.id)


@app.post("/api/properties", response_model=schemas.PropertyOut, status_code=201)
def create_property(prop: schemas.PropertyCreate, db: Session = Depends(get_db), current_user: models.User = Depends(auth.get_current_user)):
    return crud.create_property(db, prop, user_id=current_user.id)


# ── Reviews ───────────────────────────────────────────────────────────────

@app.get("/api/reviews/search", response_model=list[schemas.ReviewOut], status_code=200)
def search_reviews(
    q: str = Query(..., min_length=1),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    user_properties = crud.get_properties(db, user_id=current_user.id)
    allowed_ids = [p.id for p in user_properties]
    
    results = crud.search_reviews(db, q)
    return [r for r in results if r.property_id in allowed_ids]


@app.get("/api/reviews/sentiment-summary", status_code=200)
def sentiment_summary(
    property_id: int | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    if property_id:
        prop = db.query(models.Property).filter(models.Property.id == property_id).first()
        if prop and prop.user_id and prop.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Not authorized to access data for this property")
            
    return crud.get_sentiment_summary(db, property_id)


@app.get("/api/reviews", response_model=list[schemas.ReviewOut], status_code=200)
def list_reviews(
    property_id: int | None = Query(None),
    sentiment: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    return reviews_visible_to(db, current_user, property_id, sentiment)


def reviews_visible_to(db: Session, user: models.User, property_id: int | None = None, sentiment: str | None = None):
    """The reviews a user may see: their own properties plus shared demo ones. One rule for every endpoint."""
    allowed_ids = [p.id for p in crud.get_properties(db, user_id=user.id)]
    if property_id:
        if property_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not authorized to access reviews for this property")
        return crud.get_reviews(db, property_id=property_id, sentiment=sentiment)
    reviews = []
    for pid in allowed_ids:
        reviews.extend(crud.get_reviews(db, property_id=pid, sentiment=sentiment))
    return reviews


@app.get("/api/reviews/{review_id}", response_model=schemas.ReviewOut, status_code=200)
def get_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    review = crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
    
    prop = db.query(models.Property).filter(models.Property.id == review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this review")
        
    return review


def owned_property(db: Session, property_id: int, user: models.User) -> models.Property:
    """Writes go only to the user's own properties. Shared demo properties (no owner) are read-only,
    otherwise one user's reviews would appear in everyone's demo data."""
    prop = db.query(models.Property).filter(models.Property.id == property_id).first()
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.user_id != user.id:
        raise HTTPException(status_code=403, detail="You can only add reviews to your own properties")
    return prop


def _dedupe_key(text: str) -> str:
    return " ".join(text.lower().split())


@app.post("/api/reviews/bulk", response_model=schemas.ReviewBulkResult, status_code=201)
def import_reviews(
    payload: schemas.ReviewBulkCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Import a chunk of reviews into one of the user's properties. Reviews whose text is already on that
    property (or repeated in the chunk) are skipped and reported, so re-running an import is safe."""
    prop = owned_property(db, payload.property_id, current_user)
    seen = {_dedupe_key(r.text) for r in crud.get_reviews(db, property_id=prop.id)}
    fresh, duplicates = [], []
    for i, item in enumerate(payload.reviews):
        key = _dedupe_key(item.text)
        if key in seen:
            duplicates.append(i)
            continue
        seen.add(key)
        fresh.append(item)
    labels = ai.classify_reviews([(item.text, item.guest_name) for item in fresh])
    rows = [
        {**item.model_dump(), "property_id": prop.id, "property_name": prop.name, "sentiment": label.sentiment,
         "is_spam": label.is_spam, "label_source": label.source, "aspects": label.aspects}
        for item, label in zip(fresh, labels)
    ]
    return {"created": crud.create_reviews(db, rows) if rows else [], "duplicates": duplicates}


@app.post("/api/reviews", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    owned_property(db, review.property_id, current_user)
    
    # A sentiment sent by the client is a human label; otherwise classify it here
    if review.sentiment is not None:
        return crud.create_review(db, review, label_source="human")

    result = ai.analyze_review_sentiment_and_spam(review.text, review.guest_name)
    review.sentiment, review.is_spam = result.sentiment, result.is_spam
    return crud.create_review(db, review, label_source=result.source, aspects=result.aspects)


@app.post("/api/reviews/{review_id}/generate-reply", status_code=200)
def generate_review_reply(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    review = crud.get_review(db, review_id)
    if not review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        
    prop = db.query(models.Property).filter(models.Property.id == review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to generate replies for this review")
        
    reply = ai.generate_management_response(
        guest_name=review.guest_name,
        property_name=review.property_name,
        rating=review.rating,
        text=review.text
    )
    return {"reply": reply.text, "source": reply.source}


@app.get("/api/ai/status", status_code=200)
def get_ai_status(current_user: models.User = Depends(auth.get_current_user)):
    """Which engine is answering right now: fine-tuned model, LLM, or keyword/template fallbacks."""
    return ai.ai_status()


@app.post("/api/ai/ask", status_code=200)
def ask_assistant(
    body: schemas.AskRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    """Answer a question from the user's own (non-spam) reviews, with the review ids it relied on."""
    reviews = [r for r in reviews_visible_to(db, current_user, body.property_id)
               if not (r.is_spam and not r.is_unflagged)]
    newest = sorted(reviews, key=lambda r: r.date, reverse=True)[:ai.ASSISTANT_MAX_REVIEWS]
    result = ai.answer_question(body.question, newest)
    return {
        "answer": result.answer, "citations": result.citations, "answerable": result.answerable,
        "source": result.source, "reviews_considered": len(newest), "reviews_total": len(reviews),
    }


@app.post("/api/ai/analyze-review", status_code=200)
def analyze_review_ai(
    payload: dict,
    current_user: models.User = Depends(auth.get_current_user)
):
    text = payload.get("text", "")
    guest_name = payload.get("guest_name", "Valued Guest")
    property_name = payload.get("property_name", "Homestay Property")
    rating = payload.get("rating", 5)

    if not text:
        raise HTTPException(status_code=400, detail="Text field is required for AI analysis")

    result = ai.analyze_review_sentiment_and_spam(text, guest_name)
    reply = ai.generate_management_response(guest_name, property_name, rating, text)

    return {
        "sentiment": result.sentiment,
        "is_spam": result.is_spam,
        "aspects": result.aspects,
        "label_source": result.source,
        "ai_response_draft": reply.text,
        "reply_source": reply.source,
        "model_used": ai.GEMINI_MODEL if "llm" in (result.source, reply.source) else None,
    }


@app.put("/api/reviews/{review_id}", response_model=schemas.ReviewOut, status_code=200)
def update_review(
    review_id: int,
    review: schemas.ReviewUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_review = crud.get_review(db, review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
    
    prop = db.query(models.Property).filter(models.Property.id == db_review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this review")
        
    return crud.update_review(db, review_id, review)


@app.patch("/api/reviews/{review_id}/flag", response_model=schemas.ReviewOut, status_code=200)
def flag_review(
    review_id: int,
    is_spam: bool | None = Query(None),
    is_unflagged: bool | None = Query(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_review = crud.get_review(db, review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        
    prop = db.query(models.Property).filter(models.Property.id == db_review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to flag this review")
        
    return crud.flag_review(db, review_id, is_spam=is_spam, is_unflagged=is_unflagged)


@app.delete("/api/reviews/{review_id}", response_model=schemas.ReviewOut, status_code=200)
def delete_review(
    review_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    db_review = crud.get_review(db, review_id)
    if not db_review:
        raise HTTPException(status_code=404, detail=f"Review {review_id} not found")
        
    prop = db.query(models.Property).filter(models.Property.id == db_review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this review")
        
    return crud.delete_review(db, review_id)
