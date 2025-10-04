# backend/reports/sales/category_analysis.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from collections import defaultdict
from typing import Literal
from datetime import datetime, date, timezone
import jdatetime

import models
import security
from database import SessionLocal
from product_grouper import group_products_by_name

router = APIRouter()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def update_category_cache(db: Session):
    """
    منطق اصلاح شده و قابل اعتماد:
    ۱. همیشه نقشه ایده‌آل دسته‌بندی‌ها را بر اساس تمام محصولات می‌سازد.
    ۲. آن را با وضعیت فعلی کش مقایسه کرده و فقط در صورت وجود تغییر، دیتابیس را آپدیت می‌کند.
    """
    all_products = db.query(models.Product).all()
    if not all_products:
        return

    all_products_dict = [{"product_id": p.product_id, "product_name": p.product_name} for p in all_products]
    
    # ۱. همیشه نقشه ایده‌آل جدید را بساز
    ideal_assignments = group_products_by_name(all_products_dict)
    
    # ۲. وضعیت فعلی کش را بخوان
    cached_entries = db.query(models.ProductCategoryCache).all()
    cached_map = {c.product_id: c for c in cached_entries}
    
    has_changes = False
    for product_id, ideal_category in ideal_assignments.items():
        cached_entry = cached_map.get(product_id)
        
        # اگر محصول در کش نیست، یا دسته‌بندی‌اش تغییر کرده
        if not cached_entry or cached_entry.assigned_category != ideal_category:
            has_changes = True
            if cached_entry:
                # آپدیت کردن دسته موجود
                cached_entry.assigned_category = ideal_category
            else:
                # ساختن رکورد جدید برای محصول جدید
                new_entry = models.ProductCategoryCache(
                    product_id=product_id,
                    assigned_category=ideal_category,
                    confidence_score=1.0 
                )
                db.add(new_entry)

    # ۳. فقط در صورت وجود تغییر، در دیتابیس ذخیره کن
    if has_changes:
        print("✅ Category cache updated with new changes.")
        db.commit()


@router.get("/category-analysis", tags=["Sales Reports"])
def get_category_analysis(
    period: Literal['day', 'week', 'month', 'year'] = 'month',
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    # ... (بخش update_cache و محاسبه بازه زمانی بدون تغییر)
    update_category_cache(db)
    
    utc_now = datetime.now(timezone.utc)
    j_today = jdatetime.date.fromgregorian(date=utc_now.date())
    start_date_gregorian = j_today.togregorian()

    if period == 'year':
        start_date_gregorian = j_today.replace(month=1, day=1).togregorian()
    elif period == 'month':
        start_date_gregorian = j_today.replace(day=1).togregorian()
    elif period == 'week':
        start_date_gregorian = (j_today - jdatetime.timedelta(days=j_today.weekday())).togregorian()
    
    sales_with_category = (
        db.query(
            models.SalesItem.total_item_price,
            models.ProductCategoryCache.assigned_category
        )
        .join(models.Invoice, models.SalesItem.invoice_id == models.Invoice.invoice_id)
        .join(models.ProductCategoryCache, models.SalesItem.product_id == models.ProductCategoryCache.product_id)
        .filter(func.date(models.Invoice.invoice_timestamp) >= start_date_gregorian)
        .all()
    )
    
    category_revenue = defaultdict(float)
    for sale in sales_with_category:
        category_revenue[sale.assigned_category] += sale.total_item_price
        
    all_categories = [
        {"category": cat, "total_revenue": rev} 
        for cat, rev in category_revenue.items() if cat != 'تک محصولی' and rev > 0
    ]
    all_categories.sort(key=lambda x: x['total_revenue'], reverse=True)
    
    # ==================================================================
    # ++ منطق جدید: محدود کردن به ۱۰ دسته برتر + دسته "سایر موارد"
    # ==================================================================
    final_report = []
    if len(all_categories) > 10:
        top_10 = all_categories[:10]
        other_categories_revenue = sum(item['total_revenue'] for item in all_categories[10:])
        final_report.extend(top_10)
        final_report.append({"category": "سایر دسته‌ها", "total_revenue": other_categories_revenue})
    else:
        final_report = all_categories
    
    return final_report