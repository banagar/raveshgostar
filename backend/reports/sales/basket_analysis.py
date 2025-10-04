# backend/reports/sales/basket_analysis.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import models, security
from database import SessionLocal

router = APIRouter()
def get_db(): db = SessionLocal(); return db

@router.get("/basket-analysis", tags=["Sales Reports"])
def get_basket_analysis(db: Session = Depends(get_db), current_user: models.User = Depends(security.get_current_user)):
    avg_basket_value = db.query(func.avg(models.Invoice.total_invoice_price)).scalar() or 0
    subquery = db.query(models.SalesItem.invoice_id, func.count(models.SalesItem.sale_item_id).label("item_count")).group_by(models.SalesItem.invoice_id).subquery()
    avg_items_per_basket = db.query(func.avg(subquery.c.item_count)).scalar() or 0
    return {
        "average_basket_value": round(avg_basket_value),
        "average_items_per_basket": round(avg_items_per_basket, 2)
    }