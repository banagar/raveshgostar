from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, date, timedelta, timezone
from typing import Literal
import jdatetime

import models
import security
from database import SessionLocal

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/top-products", tags=["Sales Reports"])
def get_top_products(
    period: Literal['day', 'week', 'month', 'year'] = 'month',
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """
    محصولات برتر را بر اساس بازه زمانی شمسی و جاری برمی‌گرداند.
    """
    # ۱. گرفتن زمان حال جهانی (UTC) و تبدیل به تاریخ شمسی
    utc_now = datetime.now(timezone.utc)
    j_today = jdatetime.date.fromgregorian(date=utc_now.date())
    
    start_date_gregorian = j_today.togregorian() # مقدار پیش‌فرض

    # --- ۲. منطق جدید و دقیق برای محاسبه تاریخ شروع هر دوره ---
    if period == 'year':
        # شروع سال جاری شمسی (مثلا: ۱۴۰۴/۰۱/۰۱)
        start_date_jalali = j_today.replace(month=1, day=1)
        start_date_gregorian = start_date_jalali.togregorian()
    
    elif period == 'month':
        # شروع ماه جاری شمسی (مثلا: ۱۴۰۴/۰۷/۰۱)
        start_date_jalali = j_today.replace(day=1)
        start_date_gregorian = start_date_jalali.togregorian()

    elif period == 'week':
        # شروع هفته جاری شمسی (شنبه این هفته)
        # weekday در jdatetime: شنبه=0, یکشنبه=1, ...
        start_date_jalali = j_today - jdatetime.timedelta(days=j_today.weekday())
        start_date_gregorian = start_date_jalali.togregorian()
    
    elif period == 'day':
        # خود امروز
        start_date_gregorian = j_today.togregorian()
    
    # --- ۳. کوئری به دیتابیس با تاریخ شروع صحیح ---
    top_products_query = (
        db.query(
            models.Product.product_name,
            func.sum(models.SalesItem.total_item_price).label("total_revenue"),
        )
        .join(models.SalesItem, models.Product.product_id == models.SalesItem.product_id)
        .join(models.Invoice, models.SalesItem.invoice_id == models.Invoice.invoice_id)
        # فیلتر از تاریخ شروع محاسبه شده تا به حال اعمال می‌شود
        .filter(func.date(models.Invoice.invoice_timestamp) >= start_date_gregorian)
        .group_by(models.Product.product_name)
        .order_by(func.sum(models.SalesItem.total_item_price).desc())
    )
    
    results = top_products_query.all()
    
    return [result._asdict() for result in results]