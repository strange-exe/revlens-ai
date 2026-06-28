from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import logging
import requests

from . import models, schemas, crud, auth
from .database import engine, get_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RevLens AI API",
    description="REST API for RevLens AI — Airbnb Review Intelligence Platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "https://revlens.abhinesh.me"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
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


# ── Authentication ────────────────────────────────────────────────────────

@app.post("/api/auth/register", response_model=schemas.TokenResponse, status_code=201)
def register(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    existing = crud.get_user_by_email(db, email=user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed = auth.hash_password(user_data.password)
    user = crud.create_user(db, user_data, hashed)
    token = auth.create_access_token(user.email)
    return {"access_token": token, "token_type": "bearer", "user": user}


@app.post("/api/auth/login", response_model=schemas.TokenResponse, status_code=200)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
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
    user_properties = crud.get_properties(db, user_id=current_user.id)
    allowed_ids = [p.id for p in user_properties]

    if property_id:
        if property_id not in allowed_ids:
            raise HTTPException(status_code=403, detail="Not authorized to access reviews for this property")
        return crud.get_reviews(db, property_id=property_id, sentiment=sentiment)
    
    # Filter all reviews by allowed property IDs
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


@app.post("/api/reviews", response_model=schemas.ReviewOut, status_code=201)
def create_review(
    review: schemas.ReviewCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    prop = db.query(models.Property).filter(models.Property.id == review.property_id).first()
    if prop and prop.user_id and prop.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to add reviews to this property")
    return crud.create_review(db, review)


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
