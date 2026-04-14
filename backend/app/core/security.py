from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
import hashlib
import secrets
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database import get_db
from app.models.admin_user import AdminUser
from app.schemas.admin import TokenData

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/admin/auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash using SHA-256"""
    # Extract salt and hash from stored password
    try:
        salt, stored_hash = hashed_password.split('$')
        computed_hash = hashlib.sha256((salt + plain_password).encode()).hexdigest()
        return computed_hash == stored_hash
    except:
        # Fallback: try direct comparison for simple hashes
        computed_hash = hashlib.sha256(plain_password.encode()).hexdigest()
        return computed_hash == hashed_password

def get_password_hash(password: str) -> str:
    """Hash a password using SHA-256 with salt"""
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256((salt + password).encode()).hexdigest()
    return f"{salt}${password_hash}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> AdminUser:
    """Get the current authenticated admin user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    admin = db.query(AdminUser).filter(AdminUser.email == token_data.email).first()
    if admin is None:
        raise credentials_exception
    
    return admin

def authenticate_admin(db: Session, email: str, password: str) -> Optional[AdminUser]:
    """Authenticate an admin user"""
    admin = db.query(AdminUser).filter(AdminUser.email == email).first()
    if not admin:
        return None
    if not verify_password(password, admin.password_hash):
        return None
    return admin
