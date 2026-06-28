from sqlalchemy import Column, Integer, String, Float, Boolean, Text
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)
    full_name = Column(String, nullable=True)
    google_id = Column(String, nullable=True, unique=True)
    picture = Column(String, nullable=True)


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    location = Column(String, nullable=False)
    price = Column(String, default="₹5,000/night")
    distance = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)
    is_user_property = Column(Boolean, default=True)
    user_id = Column(Integer, nullable=True)  # Links property to a registered User


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, nullable=False)
    property_name = Column(String, nullable=False)
    guest_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    date = Column(String, nullable=False)
    sentiment = Column(String, default="neutral")
    source = Column(String, default="Airbnb")
    is_spam = Column(Boolean, default=False)
    is_unflagged = Column(Boolean, default=False)
    response = Column(Text, nullable=True)
