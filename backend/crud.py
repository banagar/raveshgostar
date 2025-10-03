# crud.py
from sqlalchemy.orm import Session
import models
import re
from database import SessionLocal
from datetime import datetime, timedelta

# Dependency برای گرفتن نشست دیتابیس
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_user_by_username(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_or_create(session: Session, model, name: str, name_field: str):
    """
    یک تابع کمکی برای اینکه چک کنیم یک آیتم (مثل مشتری یا محصول)
    در دیتابیس وجود داره یا نه. اگر نبود، یکی جدید میسازه.
    """
    instance = session.query(model).filter(getattr(model, name_field) == name).first()
    if not instance:
        instance = model(**{name_field: name})
        session.add(instance)
        session.commit()
        session.refresh(instance)
    return instance

def parse_persian_number(text: str) -> int:
    """
    اعداد فارسی یا عربی را به انگلیسی تبدیل می‌کند.
    """
    persian_to_english = str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789')
    arabic_to_english = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
    return int(text.translate(persian_to_english).translate(arabic_to_english))

def parse_price(price_text: str) -> int:
    """
    تابع جدید و هوشمند برای تبدیل قیمت‌های متنی به عدد.
    مثلا 'دو میلیون و پانصد هزار تومان' را به 2500000 تبدیل می‌کند.
    """
    price_text = price_text.replace("تومان", "").strip()
    
    # استخراج تمام اعداد از متن
    # اعداد فارسی را هم به انگلیسی تبدیل می‌کنیم
    persian_to_english = str.maketrans('۰۱۲۳۴۵۶۷۸۹', '0123456789')
    price_text_en = price_text.translate(persian_to_english)
    numbers_str = re.findall(r'\d+', price_text_en)
    number_val = int("".join(numbers_str)) if numbers_str else 0
    
    # اگر کلماتی مثل "میلیون" یا "هزار" وجود داشت، عدد را در آن ضرب کن
    if "میلیون" in price_text:
        number_val *= 1_000_000
    elif "هزار" in price_text:
        number_val *= 1_000
        
    # بخش هوشمند برای حالت‌های متنی مثل "دو میلیون و پانصد هزار"
    # این بخش اعداد را استخراج و جمع می‌کند
    total_price = 0
    words = price_text.split()
    value_map = {"یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5, "شش": 6, "هفت": 7, "هشت": 8, "نه": 9, "ده": 10,
                 "صد": 100, "دویست": 200, "پانصد": 500}

    temp_val = 0
    for i, word in enumerate(words):
        if word in value_map:
            temp_val += value_map[word]
        elif word == "هزار":
            total_price += (temp_val or 1) * 1000
            temp_val = 0
        elif word == "میلیون":
            total_price += (temp_val or 1) * 1_000_000
            temp_val = 0
            
    total_price += temp_val

    # اگر هر دو حالت عددی و متنی وجود داشت، بزرگتر را انتخاب کن
    return max(number_val, total_price)


def create_sale_from_entities(db: Session, entities: list, raw_text: str):
    """
    تابع اصلی و بازنویسی شده برای پشتیبانی از چندین محصول در یک فاکتور.
    """
    # مقادیر پیش‌فرض
    customer_name = "مشتری عمومی"
    sale_datetime = datetime.now()
    sale_items_data = []
    current_item = {}

    # 1. استخراج مشتری و تاریخ از کل موجودیت‌ها
    for entity in entities:
        group = entity["entity_group"]
        word = entity["word"]
        if group == "CUSTOMER":
            customer_name = word
        elif group == "DATETIME":
            if word == "دیروز":
                sale_datetime = datetime.now() - timedelta(days=1)

    # 2. گروه‌بندی موجودیت‌ها برای هر محصول
    for entity in entities:
        group = entity["entity_group"]
        word = entity["word"]

        if group == "QUANTITY":
            try:
                quantity = parse_persian_number(word)
            except ValueError:
                quantity_map = {"یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5}
                quantity = quantity_map.get(word, 1)
            current_item['quantity'] = quantity
        
        elif group == "PRODUCT":
            current_item['product_name'] = word

        elif group == "PRICE":
            current_item['price_per_item'] = parse_price(word)
            # با رسیدن به قیمت، یک آیتم کامل شده و به لیست اضافه می‌شود
            if 'product_name' in current_item and 'price_per_item' in current_item:
                # اگر تعداد مشخص نشده بود، ۱ در نظر بگیر
                if 'quantity' not in current_item:
                    current_item['quantity'] = 1
                
                sale_items_data.append(current_item)
                current_item = {} # آیتم فعلی را برای محصول بعدی ریست کن

    # اگر آیتمی بدون قیمت در انتها باقی مانده بود (بعید اما ممکن)
    if 'product_name' in current_item and 'quantity' in current_item and 'price_per_item' not in current_item:
        current_item['price_per_item'] = 0 # قیمت پیش‌فرض
        sale_items_data.append(current_item)

    # اگر هیچ محصولی پیدا نشد، عملیات را متوقف کن
    if not sale_items_data:
        # در اینجا می‌توانید یک خطا برگردانید یا یک فاکتور خالی ایجاد کنید
        # فعلا یک فاکتور خالی برمی‌گردانیم
        return None 

    # 3. ساخت مشتری، کانال فروش و فاکتور اصلی
    customer = get_or_create(db, models.Customer, name=customer_name, name_field="customer_name")
    channel = get_or_create(db, models.SalesChannel, name="فروش حضوری", name_field="channel_name")
    
    # قیمت کل اولیه صفر است و بعدا آپدیت می‌شود
    new_invoice = models.Invoice(
        customer_id=customer.customer_id,
        channel_id=channel.channel_id,
        total_invoice_price=0,
        invoice_timestamp=sale_datetime
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    # 4. افزودن تمام آیتم‌های فروش به فاکتور
    total_invoice_price = 0
    for item_data in sale_items_data:
        product = get_or_create(db, models.Product, name=item_data['product_name'], name_field="product_name")
        
        quantity = item_data['quantity']
        price_per_item = item_data['price_per_item']
        total_item_price = quantity * price_per_item
        total_invoice_price += total_item_price

        new_sale_item = models.SalesItem(
            invoice_id=new_invoice.invoice_id,
            product_id=product.product_id,
            quantity=quantity,
            price_per_item=price_per_item,
            total_item_price=total_item_price
        )
        db.add(new_sale_item)

    # 5. به‌روزرسانی قیمت کل فاکتور
    new_invoice.total_invoice_price = total_invoice_price
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    
    return new_invoice

def get_recent_invoices(db: Session, limit: int = 5):
    """
    تابع جدید برای دریافت آخرین فاکتورهای ثبت شده.
    """
    return db.query(models.Invoice).order_by(models.Invoice.invoice_timestamp.desc()).limit(limit).all()