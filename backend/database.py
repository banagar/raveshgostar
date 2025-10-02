from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# آدرس پایگاه داده SQLite ما
SQLALCHEMY_DATABASE_URL = "sqlite:///./sql_app.db"

# موتور SQLAlchemy رو می‌سازیم
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# یک SessionLocal برای ارتباط با دیتابیس ایجاد می‌کنیم
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# یک کلاس Base می‌سازیم که مدل‌های ما از اون ارث‌بری خواهند کرد
Base = declarative_base()