# backend/reports/sales/peak_time_analysis.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
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

@router.get("/peak-time-analysis", tags=["Sales Reports"])
def get_peak_time_analysis(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(security.get_current_user)
):
    """
    فروش را به تفکیک ساعت در روز و روز هفته (بر اساس تقویم شمسی) برمی‌گرداند.
    """
    # ۱. تحلیل فروش بر اساس ساعت در روز (این بخش تغییری نکرده)
    sales_by_hour = (
        db.query(
            extract('hour', models.Invoice.invoice_timestamp).label('hour'),
            func.sum(models.Invoice.total_invoice_price).label('total_sales')
        )
        .group_by('hour')
        .order_by('hour')
        .all()
    )

    # ==================================================================
    # ++ منطق جدید و اصلاح شده برای محاسبه روزهای هفته شمسی
    # ==================================================================
    # ۲. تحلیل فروش بر اساس روز هفته (شنبه = ۱, ... جمعه = ۷)
    # از تابع to_char برای استخراج روز هفته بر اساس استاندارد 'D' (Day of week) استفاده می‌کنیم
    # که در اکثر دیتابیس‌ها یکشنبه=۱ ... شنبه=۷ است. ما در پایتون این را اصلاح می‌کنیم.
    sales_by_day_db = (
        db.query(
            func.to_char(models.Invoice.invoice_timestamp, 'D').label('day_of_week'),
            func.sum(models.Invoice.total_invoice_price).label('total_sales')
        )
        .group_by(func.to_char(models.Invoice.invoice_timestamp, 'D'))
        .all()
    )
    
    # ۳. تبدیل شماره روز هفته به نام فارسی و مرتب‌سازی صحیح
    # شنبه=۰, یکشنبه=۱, ... جمعه=۶
    days_map_python = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]
    
    # دیکشنری برای نگهداری فروش هر روز هفته
    daily_sales = {day: 0 for day in days_map_python}
    
    # تبدیل شماره روز هفته دیتابیس به استاندارد پایتون (شنبه=۰)
    for row in sales_by_day_db:
        # روز هفته از دیتابیس یک رشته است، آن را به عدد تبدیل می‌کنیم
        day_index_db = int(row.day_of_week)
        # تبدیل استاندارد (یکشنبه=۱ ... شنبه=۷) به (شنبه=۰ ... جمعه=۶)
        # فرمول: (db_index % 7)
        py_day_index = day_index_db % 7 
        day_name = days_map_python[py_day_index]
        daily_sales[day_name] = row.total_sales

    # ۴. ساخت خروجی نهایی با ترتیب درست (شنبه تا جمعه)
    final_sales_by_day = [{"day_of_week": day, "total_sales": daily_sales[day]} for day in days_map_python]
    
    return {
        "sales_by_hour": [row._asdict() for row in sales_by_hour],
        "sales_by_day": final_sales_by_day
    }