from sqlalchemy.orm import Session
from sqlalchemy import or_
from . import models, schemas


# ── Properties ────────────────────────────────────────────────────────────

def get_properties(db: Session, user_id: int = None):
    if user_id:
        return db.query(models.Property).filter(
            or_(models.Property.user_id == user_id, models.Property.user_id.is_(None))
        ).all()
    return db.query(models.Property).all()


def create_property(db: Session, prop: schemas.PropertyCreate, user_id: int = None):
    db_prop = models.Property(**prop.model_dump())
    if user_id:
        db_prop.user_id = user_id
    db.add(db_prop)
    db.commit()
    db.refresh(db_prop)
    return db_prop


# ── Reviews ───────────────────────────────────────────────────────────────

def get_reviews(db: Session, property_id=None, sentiment=None):
    q = db.query(models.Review)
    if property_id:
        q = q.filter(models.Review.property_id == property_id)
    if sentiment:
        q = q.filter(models.Review.sentiment == sentiment)
    return q.all()


def get_review(db: Session, review_id: int):
    return db.query(models.Review).filter(models.Review.id == review_id).first()


def create_review(db: Session, review: schemas.ReviewCreate):
    db_review = models.Review(**review.model_dump())
    db.add(db_review)
    db.commit()
    db.refresh(db_review)
    return db_review


def update_review(db: Session, review_id: int, review: schemas.ReviewUpdate):
    db_review = get_review(db, review_id)
    if not db_review:
        return None
    for field, value in review.model_dump(exclude_unset=True).items():
        setattr(db_review, field, value)
    db.commit()
    db.refresh(db_review)
    return db_review


def flag_review(db: Session, review_id: int, is_spam=None, is_unflagged=None):
    db_review = get_review(db, review_id)
    if not db_review:
        return None
    if is_spam is not None:
        db_review.is_spam = is_spam
    if is_unflagged is not None:
        db_review.is_unflagged = is_unflagged
    db.commit()
    db.refresh(db_review)
    return db_review


def delete_review(db: Session, review_id: int):
    db_review = get_review(db, review_id)
    if not db_review:
        return None
    db.delete(db_review)
    db.commit()
    return db_review


def search_reviews(db: Session, query: str):
    pattern = f"%{query}%"
    return db.query(models.Review).filter(
        or_(
            models.Review.text.ilike(pattern),
            models.Review.guest_name.ilike(pattern),
            models.Review.property_name.ilike(pattern),
        )
    ).all()


def get_sentiment_summary(db: Session, property_id=None):
    q = db.query(models.Review)
    if property_id:
        q = q.filter(models.Review.property_id == property_id)
    reviews = q.all()
    total = len(reviews)
    positive = sum(1 for r in reviews if r.sentiment == "positive")
    neutral = sum(1 for r in reviews if r.sentiment == "neutral")
    negative = sum(1 for r in reviews if r.sentiment == "negative")
    return {"positive": positive, "neutral": neutral, "negative": negative, "total": total}


# ── Database Seeding ──────────────────────────────────────────────────────

# ── User CRUD ─────────────────────────────────────────────────────────────

def get_user(db: Session, user_id: int):
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate, hashed_password: str):
    db_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def get_or_create_google_user(db: Session, google_id: str, email: str, full_name: str, picture: str):
    # Try by google_id
    db_user = db.query(models.User).filter(models.User.google_id == google_id).first()
    if db_user:
        return db_user

    # Try by email (if they registered with email previously, link it)
    db_user = db.query(models.User).filter(models.User.email == email).first()
    if db_user:
        db_user.google_id = google_id
        if not db_user.picture:
            db_user.picture = picture
        db.commit()
        db.refresh(db_user)
        return db_user

    # Create new Google Auth user
    db_user = models.User(
        email=email,
        google_id=google_id,
        full_name=full_name,
        picture=picture
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


def seed_database(db: Session):
    # Only seed if completely empty
    if db.query(models.Property).count() > 0:
        return

    # Seed Properties
    properties_data = [
        {"name": "Sunset Villa", "location": "Goa", "price": "₹8,500/night", "distance": "0.3 km from beach", "rating": 4.6, "reviews_count": 0, "is_user_property": True},
        {"name": "Lakeview Cottage", "location": "Nainital", "price": "₹5,200/night", "distance": "1.1 km from lake", "rating": 3.8, "reviews_count": 0, "is_user_property": True},
        {"name": "Mountain Retreat", "location": "Manali", "price": "₹6,800/night", "distance": "2.5 km from Rohtang", "rating": 3.7, "reviews_count": 0, "is_user_property": True},
        {"name": "Doon Valley Retreat", "location": "Dehradun", "price": "₹4,500/night", "distance": "0.8 km from Robber's Cave", "rating": 4.5, "reviews_count": 0, "is_user_property": True},
    ]

    for p_data in properties_data:
        db_prop = models.Property(**p_data)
        db.add(db_prop)
    db.commit()

    # Seed Reviews
    reviews_data = [
        {"property_id": 1, "property_name": "Sunset Villa", "guest_name": "Priya Sharma", "rating": 5, "text": "Absolutely stunning property! The view was breathtaking and the amenities were top-notch. Will definitely come back.", "date": "2026-05-28", "sentiment": "positive", "source": "Airbnb"},
        {"property_id": 1, "property_name": "Sunset Villa", "guest_name": "Rahul Verma", "rating": 4, "text": "Great stay overall. The pool was clean and the staff was friendly. Could improve the WiFi speed though.", "date": "2026-05-20", "sentiment": "positive", "source": "Booking.com"},
        {"property_id": 2, "property_name": "Lakeview Cottage", "guest_name": "Ananya Gupta", "rating": 5, "text": "Perfect weekend getaway. The lake view from the room was magical. The host left a lovely welcome basket.", "date": "2026-05-15", "sentiment": "positive", "source": "Airbnb"},
        {"property_id": 2, "property_name": "Lakeview Cottage", "guest_name": "Vikram Singh", "rating": 3, "text": "Decent place but the road leading to the property is in bad condition. The rooms were clean and comfortable.", "date": "2026-05-10", "sentiment": "neutral", "source": "Google"},
        {"property_id": 3, "property_name": "Mountain Retreat", "guest_name": "Sneha Patel", "rating": 5, "text": "Best mountain view I've ever experienced! The bonfire setup was incredible. Highly recommend for couples.", "date": "2026-05-05", "sentiment": "positive", "source": "Airbnb"},
        {"property_id": 3, "property_name": "Mountain Retreat", "guest_name": "Arjun Nair", "rating": 2, "text": "Disappointing. The room was smaller than pictured and the heating wasn't working properly during our stay.", "date": "2026-04-28", "sentiment": "negative", "source": "Booking.com"},
        {"property_id": 1, "property_name": "Sunset Villa", "guest_name": "Meera Joshi", "rating": 4, "text": "Lovely property with great amenities. The sunset view from the balcony is unmatched. Minor issues with check-in timing.", "date": "2026-04-20", "sentiment": "positive", "source": "Google"},
        {"property_id": 2, "property_name": "Lakeview Cottage", "guest_name": "Karan Mehta", "rating": 1, "text": "Not worth the price. The lake was far from the property despite the name. Breakfast options were very limited.", "date": "2026-04-15", "sentiment": "negative", "source": "Airbnb"},
        {"property_id": 3, "property_name": "Mountain Retreat", "guest_name": "Neha Kapoor", "rating": 4, "text": "Great location and friendly staff. The trekking guide arranged by the property was excellent. Just needs better room insulation.", "date": "2026-04-10", "sentiment": "positive", "source": "Booking.com"},
        {"property_id": 1, "property_name": "Sunset Villa", "guest_name": "Deepak Choudhary", "rating": 3, "text": "Average experience. The property is well-maintained but overpriced for what it offers. Nearby construction was noisy.", "date": "2026-04-05", "sentiment": "neutral", "source": "Google"},
        {"property_id": 1, "property_name": "Sunset Villa", "guest_name": "TravelDealsBot", "rating": 1, "text": "AMAZING DISCOUNTS! Get 50% off homestays and hotels by clicking here: http://promo-hotels-spam.ru/discount. Don't miss out!", "date": "2026-06-12", "sentiment": "negative", "source": "Google", "is_spam": True},
        {"property_id": 2, "property_name": "Lakeview Cottage", "guest_name": "John9921", "rating": 2, "text": "Very poor stay. asdfghjkl qwertyuiop zxcvbnm hgfdsa asdfghjklqwertyuiop terrible management.", "date": "2026-06-10", "sentiment": "negative", "source": "Booking.com", "is_spam": True},
        {"property_id": 3, "property_name": "Mountain Retreat", "guest_name": "ReviewerBot", "rating": 1, "text": "This is a fake review repeated multiple times. This is a fake review repeated multiple times. Terrible service.", "date": "2026-06-08", "sentiment": "negative", "source": "Airbnb", "is_spam": True},
        {"property_id": 4, "property_name": "Doon Valley Retreat", "guest_name": "Sumit Jha", "rating": 5, "text": "Fantastic location right near the Robber's Cave. The host was very accommodating and the food was authentic Pahari cuisine.", "date": "2026-06-15", "sentiment": "positive", "source": "Airbnb"},
        {"property_id": 4, "property_name": "Doon Valley Retreat", "guest_name": "Pooja Desai", "rating": 4, "text": "Peaceful environment, away from the city traffic. Rooms were spacious, but the geyser took a while to heat up.", "date": "2026-06-10", "sentiment": "positive", "source": "Booking.com"},
    ]

    for r_data in reviews_data:
        db_review = models.Review(
            property_id=r_data["property_id"],
            property_name=r_data["property_name"],
            guest_name=r_data["guest_name"],
            rating=r_data["rating"],
            text=r_data["text"],
            date=r_data["date"],
            sentiment=r_data["sentiment"],
            source=r_data["source"],
            is_unflagged=False,
            is_spam=r_data.get("is_spam", False),
        )
        db.add(db_review)

        # Update property stats
        prop = db.query(models.Property).filter(models.Property.id == r_data["property_id"]).first()
        if prop:
            prop.reviews_count += 1

    db.commit()

    # Recalculate ratings after all reviews are inserted
    for prop in db.query(models.Property).all():
        reviews = db.query(models.Review).filter(models.Review.property_id == prop.id).all()
        if reviews:
            prop.rating = round(sum(r.rating for r in reviews) / len(reviews), 1)
    db.commit()
