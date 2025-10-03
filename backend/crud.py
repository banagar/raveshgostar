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
    تابع اصلی و بازنویسی شده برای ذخیره اطلاعات در دیتابیس.
    حالا از تمام موجودیت‌های استخراج شده توسط مدل جدید پشتیبانی می‌کند.
    """
    # مقادیر پیش‌فرض
    customer_name = "مشتری عمومی"
    product_name = None # <<-- تغییر: اول محصول را None در نظر می‌گیریم
    price = 0
    quantity = 1
    quantity_word = None # <<-- اضافه شده: کلمه مربوط به تعداد را نگه می‌داریم
    sale_datetime = datetime.now() 

    # استخراج هوشمند اطلاعات از لیست موجودیت‌ها
    for entity in entities:
        group = entity["entity_group"]
        word = entity["word"]
        
        if group == "CUSTOMER":
            customer_name = word
        elif group == "PRODUCT":
            product_name = word
        elif group == "PRICE":
            price = parse_price(word)
        elif group == "QUANTITY":
            quantity_word = word # <<-- کلمه تعداد را ذخیره می‌کنیم
            try:
                quantity = parse_persian_number(word)
            except ValueError:
                quantity_map = {"یک": 1, "دو": 2, "سه": 3, "چهار": 4, "پنج": 5}
                quantity = quantity_map.get(word, 1)
        elif group == "DATETIME":
            if word == "دیروز":
                sale_datetime = datetime.now() - timedelta(days=1)

    # ==================================================================
    # بخش جدید: منطق جایگزین برای پیدا کردن محصول
    # ==================================================================
    if product_name is None and quantity_word is not None:
        try:
            words = raw_text.split()
            # پیدا کردن ایندکس کلمه‌ی تعداد
            quantity_index = words.index(quantity_word)
            # کلمه‌ی بعدی به احتمال زیاد محصول است
            if quantity_index + 1 < len(words):
                product_name = words[quantity_index + 1]
        except (ValueError, IndexError):
            # اگر کلمه تعداد در متن خام پیدا نشد یا کلمه آخری بود
            product_name = "محصول نامشخص"
            
    if product_name is None:
         product_name = "محصول نامشخص"
    # ==================================================================

    # گرفتن یا ساختن مشتری و محصول در دیتابیس
    customer = get_or_create(db, models.Customer, name=customer_name, name_field="customer_name")
    product = get_or_create(db, models.Product, name=product_name, name_field="product_name")
    
    # یک کانال فروش پیش‌فرض
    channel = get_or_create(db, models.SalesChannel, name="فروش حضوری", name_field="channel_name")

    # ساخت فاکتور با تاریخ صحیح
    new_invoice = models.Invoice(
        customer_id=customer.customer_id,
        channel_id=channel.channel_id,
        total_invoice_price=price * quantity, # محاسبه قیمت کل
        invoice_timestamp=sale_datetime
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)

    # افزودن آیتم به فاکتور با تعداد و قیمت صحیح
    new_sale_item = models.SalesItem(
        invoice_id=new_invoice.invoice_id,
        product_id=product.product_id,
        quantity=quantity,
        price_per_item=price,
        total_item_price=price * quantity
    )
    db.add(new_sale_item)
    db.commit()
    db.refresh(new_sale_item)
    
    return new_invoice