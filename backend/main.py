# main.py
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File  # این دو مورد رو اضافه کن
from transcriber import transcribe_audio_from_bytes  # ماژول جدید رو ایمپورت کن
from sqlalchemy.orm import Session
from datetime import timedelta
import random
from typing import List

import security
import models
import schemas
import crud
from database import SessionLocal, engine
from nlp_processor import extract_entities
from reports.sales import trend_analysis
from reports.sales import top_products
from reports.kpi import kpi_summary

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",  # آدرس فرانت‌اند شما
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # اجازه به تمام متدها (GET, POST, etc.)
    allow_headers=["*"],  # اجازه به تمام هدرها
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/api/token", response_model=schemas.Token)
def login_for_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
):
    # ۱. کاربر رو از دیتابیس پیدا کن
    user = crud.get_user_by_username(db, username=form_data.username)

    # ۲. چک کن کاربر وجود داره و پسوردش درسته
    if not user or not security.verify_password(
        form_data.password, user.hashed_password
    ):
        raise HTTPException(
            status_code=401,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ۳. اگر همه چیز درست بود، یک توکن بساز
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = security.create_access_token(
        data={"sub": user.username, "display_name": user.display_name},
        expires_delta=access_token_expires,
    )

    # ۴. توکن رو برگردون
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/")
def read_root():
    return {"Status": "Project Foundation is Ready!"}


# اتصال روتر گزارش KPI <-- این بخش رو اضافه کن
app.include_router(
    kpi_summary.router, prefix="/api/reports/kpi", tags=["Sales Reports"]
)

# اتصال روتر گزارش روند فروش
app.include_router(
    trend_analysis.router, prefix="/api/reports/sales", tags=["Sales Reports"]
)

# اتصال روتر گزارش محصولات برتر <-- این بخش رو اضافه کن
app.include_router(
    top_products.router,
    prefix="/api/reports/sales",
    # tags رو اینجا تعریف نمی‌کنیم چون در خود روتر تعریف شده
)


# =================================================================
# ENDPOINT جدید برای تبدیل صوت به متن
# =================================================================
@app.post("/api/transcribe", response_model=schemas.TranscriptionResponse)
async def create_transcription(file: UploadFile = File(...)):
    """
    یک فایل صوتی دریافت کرده و آن را به متن تبدیل می‌کند.
    """
    # چک کردن فرمت فایل (اختیاری ولی پیشنهاد می‌شود)
    if not file.content_type.startswith("audio/"):
        raise HTTPException(status_code=400, detail="فایل ارسال شده صوتی نیست.")

    try:
        # محتوای فایل را به صورت بایت می‌خوانیم
        audio_bytes = await file.read()

        # تابع پردازشگر صوت را صدا می‌زنیم
        transcribed_text = transcribe_audio_from_bytes(audio_bytes)

        return {"transcription": transcribed_text}

    except (ValueError, ConnectionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # برای خطاهای پیش‌بینی نشده دیگر
        print(f"Server error during transcription: {e}")
        raise HTTPException(status_code=500, detail="یک خطای داخلی در سرور رخ داد.")


# =================================================================
# ENDPOINT جدید برای جمله انگیزشی
# =================================================================
# لیستی از جملات انگیزشی
QUOTES = [
    {
        "quote": "تنها راه انجام دادن کارهای بزرگ، دوست داشتن کاری است که انجام می‌دهی.",
        "author": "استیو جابز",
    },
    {
        "quote": "موفقیت یعنی رفتن از شکستی به شکست دیگر بدون از دست دادن اشتیاق.",
        "author": "وینستون چرچیل",
    },
    {
        "quote": "رویاهای خود را بسازید، وگرنه فرد دیگری شما را برای ساختن رویای خود استخدام خواهد کرد.",
        "author": "فرح گری",
    },
]


@app.get("/api/quote", response_model=schemas.Quote)
def get_random_quote(current_user: models.User = Depends(security.get_current_user)):
    """
    یک جمله انگیزشی تصادفی برمی‌گرداند.
    """
    return random.choice(QUOTES)


# =================================================================
# ENDPOINT جدید برای آخرین فعالیت‌ها
# =================================================================
@app.get("/api/recent-activities", response_model=List[schemas.RecentActivity])
def read_recent_activities(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    """
    لیستی از آخرین فاکتورهای ثبت شده را برمی‌گرداند.
    """
    invoices = crud.get_recent_invoices(db, limit=5)
    # برای اینکه Pydantic بتواند customer_name را بخواند، باید به این شکل تبدیل شود
    activities = []
    for invoice in invoices:
        activities.append(
            {
                "customer_name": invoice.customer.customer_name,
                "total_invoice_price": invoice.total_invoice_price,
                "invoice_timestamp": invoice.invoice_timestamp,
            }
        )
    return activities


@app.post("/api/command", response_model=schemas.SaleConfirmation)
def process_command(
    command: schemas.UserCommand,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user),
):
    raw_text = command.command_text
    entities = extract_entities(raw_text)
    new_invoice = crud.create_sale_from_entities(db, entities, raw_text)

    if new_invoice is None:
        raise HTTPException(
            status_code=400, detail="اطلاعات کافی برای ثبت فروش یافت نشد."
        )

    db.refresh(new_invoice)

    # ساخت لیست آیتم‌ها برای پاسخ JSON
    response_items = [
        {
            "product_name": item.product.product_name,
            "quantity": item.quantity,
            "price_per_item": item.price_per_item,
            "total_item_price": item.total_item_price,
        }
        for item in new_invoice.items
    ]

    return {
        "message": "فروش با موفقیت ثبت شد!",
        "invoice_id": new_invoice.invoice_id,
        "customer_name": new_invoice.customer.customer_name,
        "total_invoice_price": new_invoice.total_invoice_price,
        "invoice_timestamp": new_invoice.invoice_timestamp,
        "items": response_items,  # <-- لیست آیتم‌ها به پاسخ اضافه شد
    }