from pydantic import BaseModel, Field
from typing import Optional


# ── Property Schemas ──────────────────────────────────────────────────────

class PropertyCreate(BaseModel):
    name: str
    location: str
    price: str = "₹5,000/night"
    distance: Optional[str] = None
    is_user_property: bool = True
    user_id: Optional[int] = None


class PropertyOut(BaseModel):
    id: int
    name: str
    location: str
    price: str
    distance: Optional[str]
    rating: float
    reviews_count: int
    is_user_property: bool
    user_id: Optional[int]

    class Config:
        from_attributes = True


# ── Review Schemas ────────────────────────────────────────────────────────

class ReviewCreate(BaseModel):
    property_id: int
    property_name: str
    guest_name: str
    rating: int = Field(..., ge=1, le=5)
    text: str
    date: str
    sentiment: str = "neutral"
    source: str = "Airbnb"
    is_spam: bool = False
    is_unflagged: bool = False
    response: Optional[str] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    text: Optional[str] = None
    sentiment: Optional[str] = None
    is_spam: Optional[bool] = None
    is_unflagged: Optional[bool] = None
    response: Optional[str] = None


class ReviewOut(BaseModel):
    id: int
    property_id: int
    property_name: str
    guest_name: str
    rating: int
    text: str
    date: str
    sentiment: str
    source: str
    is_spam: bool
    is_unflagged: bool
    response: Optional[str]

    class Config:
        from_attributes = True


# ── User & Auth Schemas ───────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    picture: Optional[str] = None
    google_id: Optional[str] = None

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    credential: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
