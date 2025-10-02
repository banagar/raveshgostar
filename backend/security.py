# security.py
from datetime import datetime, timedelta, timezone
from passlib.context import CryptContext
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import schemas
import crud
from database import SessionLocal
from sqlalchemy.orm import Session

# تنظیمات امنیتی
SECRET_KEY = "a_very_secret_key_that_should_be_changed" # این کلید باید خیلی پیچیده و خارج از کد باشه
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# برای هش کردن پسورد
pwd_context = CryptContext(schemes=["argon2"], deprecated="auto")

# این خط رو بعد از تنظیمات اولیه اضافه کن
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def verify_password(plain_password, hashed_password):
    """پسورد خام را با نسخه هش شده مقایسه می‌کند"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """پسورد خام را به هش تبدیل می‌کند"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """یک توکن JWT جدید می‌سازد"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(crud.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = schemas.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = crud.get_user_by_username(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user