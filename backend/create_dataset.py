import json
import random

# ==============================================================================
# ۱. داده‌های اولیه (بدون تغییر)
# ==============================================================================
products_food = ["برنج", "روغن مایع", "رب گوجه فرنگی", "ماکارونی", "تن ماهی", "قند", "شکر", "چای خشک", "شیر", "پنیر"]
products_cosmetics = ["کرم ضد آفتاب", "رژ لب", "ریمل", "شامپو", "صابون", "کرم مرطوب کننده", "عطر", "ادکلن", "لاک ناخن", "خط چشم"]
products_car = ["لنت ترمز", "فیلتر روغن", "شمع خودرو", "تسمه تایم", "روغن موتور", "دیسک و صفحه", "باتری خودرو", "ضد یخ", "لاستیک", "برف پاک کن"]
products_tools = ["دریل", "پیچ گوشتی", "چکش", "انبردست", "آچار فرانسه", "متر", "تراز", "سیم چین", "کاتر", "دستکش کار"]
products_nuts = ["پسته", "بادام", "گردو", "شکلات تلخ", "گز", "سوهان", "باسلق", "آجیل مخلوط", "کشمش", "انجیر خشک"]
products_digital = ["گوشی موبایل", "لپ تاپ", "موس", "کیبورد", "مانیتور", "پرینتر", "هارد اکسترنال", "فلش مموری", "پاور بانک", "اسپیکر بلوتوث"]
products_stationery = ["خودکار", "مداد", "دفتر", "کاغذ A4", "ماژیک هایلایت", "پاک کن", "تراش", "پوشه", "چسب نواری", "منگنه"]
products_appliances = ["تلویزیون", "یخچال", "ماشین لباسشویی", "جاروبرقی", "اتو", "ماکروویو", "چای ساز", "پلوپز", "آبمیوه گیری", "مخلوط کن"]
products_cafe = ["قهوه اسپرسو", "کاپوچینو", "لاته", "کیک شکلاتی", "چیزکیک", "چای ماسالا", "شیک شکلات", "کروسان", "اسموتی", "آب پرتقال"]
products_clothing = ["پیراهن مردانه", "شلوار جین", "مانتو", "کفش اسپرت", "کیف دستی زنانه", "تیشرت", "شال", "روسری", "کفش رسمی", "کاپشن"]

ALL_PRODUCTS = (
    products_food + products_cosmetics + products_car + products_tools +
    products_nuts + products_digital + products_stationery +
    products_appliances + products_cafe + products_clothing
)

PRICES = [
    "۲۰ هزار تومان", "۷۵ هزار", "۱۵۰ هزار تومن", "۹۰ هزار",
    "سیصد هزار تومان", "پانصد و پنجاه هزار", "۹۵۰ هزار تومن", "۷۵۰ هزار",
    "یک میلیون تومان", "دو میلیون و پانصد هزار", "۵ میلیون تومن",
    "۱.۵ میلیون تومان", "سه میلیون و دویست", "۱۰ میلیون", "۴ میلیون و صد هزار",
    "هشتصد هزار", "دو میلیون و نهصد هزار تومان", "۶۵۰ هزار تومان"
]

CUSTOMER_PREFIXES = ["آقای", "خانم", "مشتری"]
CUSTOMER_NAMES = ["رضایی", "احمدی", "محمدی", "اکبری", "صادقی", "مرادی", "حسینی", "کریمی", "نوروزی", "هاشمی", "جعفری", "موسوی", "عباسی", "قاسمی"]
QUANTITIES = ["یک", "دو", "سه", "چهار", "پنج", "۱", "۲", "۳", "۴", "۵", "۱۰", "۱۲"]
UNITS = ["تا", "عدد", "دونه", "بسته", "کارتن"]
DATETIME_EXPRESSIONS = ["امروز", "دیروز", "همین الان", "ساعت ۴", "فردا صبح", "امروز ظهر", ""]

# ==============================================================================
# ۲. قالب‌های جملات: کاراکترهای اضافه حذف شدند تا مشکل توکنایزر حل شود
# ==============================================================================
TEMPLATES = [
    "{datetime} {quantity} {unit} {product} برای {customer} به قیمت {price} ثبت کن",
    "یه فاکتور بزن برای {customer} : {quantity} {unit} {product} قیمت {price}",
    "{customer} {quantity} {unit} {product} خواستن به قیمت {price}",
    "{datetime} {quantity} {unit} {product} به قیمت {price} ثبت کن",
    "یک فروش جدید : {quantity} {unit} {product} با قیمت {price}",
    "{quantity} {unit} {product} برای {customer} به قیمت {price} حساب کن",
    "ثبت کن : {product} تعداد {quantity} {unit} قیمت واحد {price}",
    "{quantity} {unit} {product} {price}"
]

# ==============================================================================
# ۳. تابع اصلی و اصلاح شده برای برچسب‌گذاری (IOB Format)
# ==============================================================================
def create_labeled_data(sentence, entities_list):
    """
    تابع جدید و هوشمند برای برچسب‌گذاری که مشکلات قبلی را ندارد.
    """
    tokens = sentence.split()
    labels = ['O'] * len(tokens)
    
    # مرتب‌سازی موجودیت‌ها بر اساس طول (از طولانی‌ترین به کوتاه‌ترین)
    # این کار باعث می‌شود ابتدا "دو میلیون تومان" پیدا شود و بعد "دو"
    sorted_entities = sorted(entities_list, key=lambda x: len(x[0]), reverse=True)

    # برای اینکه بدانیم کدام توکن‌ها قبلا برچسب خورده‌اند
    tagged_indices = [False] * len(tokens)

    for entity_text, entity_tag in sorted_entities:
        if not entity_text:
            continue
        
        entity_tokens = entity_text.split()
        
        for i in range(len(tokens) - len(entity_tokens) + 1):
            # اگر این بخش از توکن‌ها قبلا برچسب نخورده باشند
            if not any(tagged_indices[i : i + len(entity_tokens)]):
                # اگر توالی توکن‌های جمله با توکن‌های موجودیت یکی بود
                if tokens[i : i + len(entity_tokens)] == entity_tokens:
                    # برچسب‌گذاری
                    labels[i] = f'B-{entity_tag}'
                    for j in range(1, len(entity_tokens)):
                        labels[i + j] = f'I-{entity_tag}'
                    
                    # علامت‌گذاری ایندکس‌ها به عنوان "برچسب خورده"
                    for k in range(len(entity_tokens)):
                        tagged_indices[i + k] = True
    
    return {"tokens": tokens, "ner_tags": labels}

# ==============================================================================
# ۴. تابع تولید جملات تصادفی (با تغییر کوچک برای ارسال لیست به جای دیکشنری)
# ==============================================================================
def generate_dataset(num_samples=2000):
    dataset = []
    for _ in range(num_samples):
        template = random.choice(TEMPLATES)
        
        product = random.choice(ALL_PRODUCTS)
        customer_name = random.choice(CUSTOMER_NAMES)
        customer = f"{random.choice(CUSTOMER_PREFIXES)} {customer_name}"
        if random.random() > 0.7: customer = customer_name
            
        quantity = random.choice(QUANTITIES)
        unit = random.choice(UNITS)
        price = random.choice(PRICES)
        datetime_str = random.choice(DATETIME_EXPRESSIONS)

        final_customer = customer if "{customer}" in template else ""
        final_datetime = datetime_str if "{datetime}" in template else ""

        # **تغییر کلیدی**: ساخت لیست به جای دیکشنری
        entities_list = [
            (product, "PRODUCT"),
            (final_customer, "CUSTOMER"),
            (quantity, "QUANTITY"),
            (price, "PRICE"),
            (final_datetime, "DATETIME")
        ]
        
        sentence = template.format(
            product=product, customer=customer, quantity=quantity,
            unit=unit, price=price, datetime=datetime_str
        ).strip()
        
        sentence = " ".join(sentence.split())
        
        labeled_sample = create_labeled_data(sentence, entities_list)
        dataset.append(labeled_sample)
        
    return dataset

# ==============================================================================
# ۵. اجرای برنامه و ذخیره خروجی
# ==============================================================================
if __name__ == "__main__":
    ner_dataset = generate_dataset(num_samples=2000)
    
    with open("ner_dataset_v4_fixed.json", "w", encoding="utf-8") as f:
        json.dump(ner_dataset, f, ensure_ascii=False, indent=2)
        
    print(f"فایل 'ner_dataset_v4_fixed.json' با موفقیت و با {len(ner_dataset)} نمونه ساخته شد.")
    
    print("\nیک نمونه خروجی صحیح برای بررسی:")
    # یک نمونه پیچیده که شامل "دو" هم در تعداد و هم در قیمت است
    test_entities = [("دو", "QUANTITY"), ("روغن موتور", "PRODUCT"), ("دو میلیون تومان", "PRICE")]
    test_sentence = "دو عدد روغن موتور دو میلیون تومان"
    correct_sample = create_labeled_data(test_sentence, test_entities)
    print(json.dumps(correct_sample, ensure_ascii=False, indent=2))