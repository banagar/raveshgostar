from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime, date, timedelta, timezone
import jdatetime

import models
import schemas
import security
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/summary", response_model=schemas.KpiSummary, tags=["Sales Reports"])
def get_kpi_summary(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    # ۱. گرفتن زمان حال جهانی و تبدیل به تاریخ شمسی
    utc_now = datetime.now(timezone.utc)
    j_today = jdatetime.date.fromgregorian(date=utc_now.date())
    
    # ۲. محاسبه فروش امروز (بر اساس تاریخ شمسی)
    today_gregorian = j_today.togregorian()
    todays_sales = db.query(func.sum(models.Invoice.total_invoice_price))\
        .filter(func.date(models.Invoice.invoice_timestamp) == today_gregorian)\
        .scalar() or 0

    # ۳. محاسبه مشتریان جدید ماه جاری (منطق صحیح و داینامیک)
    start_of_jalali_month = j_today.replace(day=1).togregorian()
    new_customers_this_month = db.query(func.count(models.Customer.customer_id))\
        .filter(func.date(models.Customer.registration_date) >= start_of_jalali_month)\
        .scalar() or 0

    # ۴. محاسبه دقیق میانگین فروش هفته جاری
    start_of_week_jalali = j_today - jdatetime.timedelta(days=j_today.weekday())
    start_of_week_gregorian = start_of_week_jalali.togregorian()
    
    # تعداد روزهای گذشته از هفته جاری (شنبه=۱, یکشنبه=۲, ...)
    days_passed_in_week = j_today.weekday() + 1

    # مجموع فروش در هفته جاری
    total_weekly_sales = db.query(func.sum(models.Invoice.total_invoice_price))\
        .filter(func.date(models.Invoice.invoice_timestamp) >= start_of_week_gregorian)\
        .scalar() or 0
    
    # محاسبه نهایی میانگین
    weekly_average_sales = 0
    if total_weekly_sales > 0:
        weekly_average_sales = total_weekly_sales / days_passed_in_week

    return {
        "todays_sales": int(todays_sales),
        "new_customers_this_month": new_customers_this_month,
        "weekly_average_sales": int(weekly_average_sales)
    }