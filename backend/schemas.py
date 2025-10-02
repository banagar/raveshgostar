# schemas.py
from pydantic import BaseModel, ConfigDict
from decimal import Decimal

class UserCommand(BaseModel):
    command_text: str

class SaleConfirmation(BaseModel):
    message: str
    invoice_id: int
    customer_name: str
    product_name: str
    total_price: int

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