from datetime import datetime, timedelta
import os, jwt, bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
from . import crud, models

MIN_JWT_SECRET_LENGTH = 32


def _load_jwt_secret() -> str:
    """Return JWT_SECRET from the environment, or raise RuntimeError so the app refuses to start."""
    jwt_secret=os.environ.get("JWT_SECRET")
    if not jwt_secret:
        raise RuntimeError('JWT Secret is missing as Environment variable\nUse `python -c "import secrets; print(secrets.token_urlsafe(48))" to generate one')

    if len(jwt_secret.strip())<MIN_JWT_SECRET_LENGTH:
        raise RuntimeError(f"JWT Secret is too short, must be of {MIN_JWT_SECRET_LENGTH} char long")
    return jwt_secret


JWT_SECRET = _load_jwt_secret()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

security = HTTPBearer()

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(email: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": email,"exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email = payload.get("sub")
        if not email:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Could not validate credentials: email missing in token",headers={"WWW-Authenticate": "Bearer"})
        user = crud.get_user_by_email(db, email=email)
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="User not found",headers={"WWW-Authenticate": "Bearer"})
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired, please login again",headers={"WWW-Authenticate": "Bearer"})
    except jwt.PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,detail="Could not validate credentials",headers={"WWW-Authenticate": "Bearer"})
