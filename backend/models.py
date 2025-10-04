# models.py
from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, DateTime, Text, Float
from sqlalchemy.orm import relationship
from database import Base
import datetime

class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String, index=True)
    category = Column(String)
    cost_price = Column(Integer)
    creation_date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))    
    sales_items = relationship("SalesItem", back_populates="product")

class Customer(Base):
    __tablename__ = "customers"
    customer_id = Column(Integer, primary_key=True, index=True)
    customer_name = Column(String, index=True)
    registration_date = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    invoices = relationship("Invoice", back_populates="customer")

class SalesChannel(Base):
    __tablename__ = "sales_channels"
    channel_id = Column(Integer, primary_key=True, index=True)
    channel_name = Column(String, unique=True, index=True)

    invoices = relationship("Invoice", back_populates="channel")

class Invoice(Base):
    __tablename__ = "invoices"
    invoice_id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"))
    channel_id = Column(Integer, ForeignKey("sales_channels.channel_id"))
    invoice_timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))    
    total_invoice_price = Column(Integer)

    customer = relationship("Customer", back_populates="invoices")
    channel = relationship("SalesChannel", back_populates="invoices")
    items = relationship("SalesItem", back_populates="invoice")

class SalesItem(Base):
    __tablename__ = "sales_items"
    sale_item_id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.invoice_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    quantity = Column(Integer)
    price_per_item = Column(Integer)
    total_item_price = Column(Integer)

    invoice = relationship("Invoice", back_populates="items")
    product = relationship("Product", back_populates="sales_items")

class Insight(Base):
    __tablename__ = "insights"
    insight_id = Column(Integer, primary_key=True, index=True)
    insight_timestamp = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))    
    insight_type = Column(String)
    insight_title = Column(String)
    insight_description = Column(Text)
    is_read = Column(Boolean, default=False)

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    display_name = Column(String, index=True)
    hashed_password = Column(String)

# ==================================================================
# ++ جدول جدید برای کش کردن دسته‌بندی محصولات
# ==================================================================
class ProductCategoryCache(Base):
    __tablename__ = "product_category_cache"
    
    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.product_id"), unique=True, index=True)
    assigned_category = Column(String, index=True)
    confidence_score = Column(Float)
    last_updated = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    
    product = relationship("Product")