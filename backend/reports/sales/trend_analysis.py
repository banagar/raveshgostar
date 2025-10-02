from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import pandas as pd
from datetime import datetime, date, timedelta, timezone
from typing import Literal
import jdatetime

import models
import security
from database import SessionLocal

router = APIRouter()

# نام ماه‌های شمسی برای لیبل‌های نمودار
JALALI_MONTHS = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
]

# نام روزهای هفته شمسی برای لیبل‌های نمودار
JALALI_WEEKDAYS = ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"]

# **جدید**: نام ترتیبی هفته‌ها
JALALI_WEEK_ORDINALS = ["اول", "دوم", "سوم", "چهارم", "پنجم", "ششم"]


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/trends", tags=["Sales Reports"])
def get_sales_trends(
    period: Literal['day', 'week', 'month'] = 'month',
    db: Session = Depends(get_db),
    current_user: models.User = Depends(security.get_current_user)
):
    j_today = jdatetime.date.today()
    # j_today = jdatetime.date(1404, 7, 9)

    # --- 1. منطق تولید لیبل‌ها و بازه‌های زمانی کامل ---
    
    labels = []
    start_date_gregorian = date.today()
    end_date_gregorian = date.today()
    complete_periods_df = pd.DataFrame()

    if period == 'month':
        start_date_gregorian = jdatetime.date(j_today.year, 1, 1).togregorian()
        next_year_start = jdatetime.date(j_today.year + 1, 1, 1)
        end_of_year_jalali = next_year_start - timedelta(days=1)
        end_date_gregorian = end_of_year_jalali.togregorian()
        
        labels = JALALI_MONTHS
        complete_periods_df = pd.DataFrame({'period_group': labels})
        complete_periods_df['sort_key'] = range(1, 13)

    elif period == 'week':
        start_of_month = j_today.replace(day=1)
        if start_of_month.month == 12:
            next_month_start = jdatetime.date(start_of_month.year + 1, 1, 1)
        else:
            next_month_start = start_of_month.replace(month=start_of_month.month + 1, day=1)
        end_of_month = next_month_start - timedelta(days=1)
        
        start_date_gregorian = start_of_month.togregorian()
        end_date_gregorian = end_of_month.togregorian()

        week_num = 1
        current_day = start_of_month
        while current_day <= end_of_month:
            # **تغییر ۱**: استفاده از لیست جدید برای ساخت لیبل
            if week_num <= len(JALALI_WEEK_ORDINALS):
                labels.append(f"هفته {JALALI_WEEK_ORDINALS[week_num - 1]}")
            else: # برای اطمینان در ماه‌های ۶ هفته‌ای
                labels.append(f"هفته {week_num}")

            start_of_week = current_day - jdatetime.timedelta(days=current_day.weekday())
            current_day = start_of_week + jdatetime.timedelta(days=7)
            week_num += 1
        
        complete_periods_df = pd.DataFrame({'period_group': labels})
        complete_periods_df['sort_key'] = range(1, len(labels) + 1)

    elif period == 'day':
        start_of_week = j_today - jdatetime.timedelta(days=j_today.weekday())
        end_of_week = start_of_week + jdatetime.timedelta(days=6)
        
        start_date_gregorian = start_of_week.togregorian()
        end_date_gregorian = end_of_week.togregorian()

        labels = JALALI_WEEKDAYS
        complete_periods_df = pd.DataFrame({'period_group': labels})
        complete_periods_df['sort_key'] = range(7)

    # --- بقیه کد بدون تغییر باقی می‌ماند ---
    
    invoices_query = db.query(
        models.Invoice.invoice_timestamp,
        models.Invoice.total_invoice_price
    ).filter(
        func.date(models.Invoice.invoice_timestamp) >= start_date_gregorian,
        func.date(models.Invoice.invoice_timestamp) <= end_date_gregorian
    ).all()

    if not invoices_query:
        complete_periods_df['total_revenue'] = 0
        complete_periods_df['sales_count'] = 0
        final_df = complete_periods_df.rename(columns={'period_group': 'invoice_timestamp'})
        if 'sort_key' in final_df.columns:
            final_df = final_df.drop(columns=['sort_key'])
        return final_df.to_dict(orient='records')

    df = pd.DataFrame(invoices_query, columns=['invoice_timestamp', 'total_invoice_price'])
    df['invoice_id'] = 1
    df['jalali_date'] = df['invoice_timestamp'].apply(lambda dt: jdatetime.date.fromgregorian(date=dt.date()))

    if period == 'month':
        df['period_group'] = df['jalali_date'].apply(lambda d: JALALI_MONTHS[d.month - 1])
        df['sort_key'] = df['jalali_date'].apply(lambda d: d.month)
    elif period == 'week':
        month_start_day = j_today.replace(day=1)
        first_day_of_first_week = month_start_day - jdatetime.timedelta(days=month_start_day.weekday())
        df['week_of_month'] = df['jalali_date'].apply(
            lambda d: (d - first_day_of_first_week).days // 7 + 1
        )
        # **تغییر ۲**: استفاده از لیست جدید برای گروه‌بندی
        df['period_group'] = df['week_of_month'].apply(
            lambda w: f"هفته {JALALI_WEEK_ORDINALS[w - 1]}" if w <= len(JALALI_WEEK_ORDINALS) else f"هفته {w}"
        )
        df['sort_key'] = df['week_of_month']
    elif period == 'day':
        df['period_group'] = df['jalali_date'].apply(lambda d: JALALI_WEEKDAYS[d.weekday()])
        df['sort_key'] = df['jalali_date'].apply(lambda d: d.weekday())

    summary = df.groupby(['period_group', 'sort_key']).agg(
        total_revenue=('total_invoice_price', 'sum'),
        sales_count=('invoice_id', 'count')
    ).reset_index()

    final_df = pd.merge(complete_periods_df, summary, on=['period_group', 'sort_key'], how='left')
    final_df[['total_revenue', 'sales_count']] = final_df[['total_revenue', 'sales_count']].fillna(0).astype(int)
    final_df = final_df.sort_values('sort_key').reset_index(drop=True)
    final_df = final_df.rename(columns={'period_group': 'invoice_timestamp'})
    final_df = final_df.drop(columns=['sort_key'])

    return final_df.to_dict(orient='records')