# schemas.py
from pydantic import BaseModel, ConfigDict
from datetime import datetime

class UserCommand(BaseModel):
    command_text: str

# مدل جدید برای نمایش آیتم‌های فروش در پاسخ API
class SalesItemResponse(BaseModel):
    product_name: str
    quantity: int
    price_per_item: int
    total_item_price: int

# مدل اصلی تایید فروش که حالا لیستی از آیتم‌ها را شامل می‌شود
class SaleConfirmation(BaseModel):
    message: str
    invoice_id: int
    customer_name: str
    total_invoice_price: int
    invoice_timestamp: datetime
    items: list[SalesItemResponse] # <-- تغییر اصلی اینجاست

    model_config = ConfigDict(from_attributes=True)

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None

class TranscriptionResponse(BaseModel):
    transcription: str

class KpiSummary(BaseModel):
    todays_sales: int
    new_customers_this_month: int
    weekly_average_sales: int

class Quote(BaseModel):
    quote: str
    author: str

class RecentActivity(BaseModel):
    customer_name: str
    total_invoice_price: int
    invoice_timestamp: datetime

    model_config = ConfigDict(from_attributes=True)