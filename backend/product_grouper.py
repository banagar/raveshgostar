# backend/product_grouper.py

from collections import Counter
import re
from typing import List, Dict

STOP_WORDS = [
    "و", "به", "با", "از", "در", "را", "برای", "یک", "عدد",
    "بسته", "کارتن", "حاوی", "گرمی", "لیتری", "سی", "گرم", "لیتر",
    "کوچک", "بزرگ", "متوسط", "جدید", "قدیم", "اصلی", "معمولی",
    "پلاس", "طلایی", "ویژه", "مخصوص", "تازه", "شرکت", "برند",
    "تولید", "مشکی", "سفید", "قرمز", "پرچرب", "کم", "چرب", "بدون", "گازدار"
]

def clean_and_tokenize(product_name: str) -> List[str]:
    """نام محصول را تمیز کرده و به لیستی از کلمات (توکن‌ها) تبدیل می‌کند."""
    cleaned_name = re.sub(r'[^ \u0621-\u0628\u062A-\u063A\u0641-\u0642\u0644-\u0648\u064E-\u0651\u0655\u067E\u0686\u0698\u06A9\u06AF\u06BE\u06CC]+', ' ', product_name)
    tokens = cleaned_name.lower().split()
    return [word for word in tokens if word not in STOP_WORDS and len(word) > 1]

def find_best_category_for_product(product_name: str, all_product_names: List[str]) -> str:
    """
    برای یک محصول، بهترین کلمه کلیدی (دسته‌بندی) را با مقایسه با نام تمام محصولات دیگر پیدا می‌کند.
    """
    target_tokens = set(clean_and_tokenize(product_name))
    if not target_tokens:
        return "عمومی"

    common_words = []
    for other_name in all_product_names:
        if product_name == other_name:
            continue
        other_tokens = set(clean_and_tokenize(other_name))
        common_words.extend(list(target_tokens.intersection(other_tokens)))

    # ==================================================================
    # ++ منطق صحیح: اگر کلمه مشترکی نبود، محصول "تک محصولی" است
    # ==================================================================
    if not common_words:
        return "تک محصولی"

    # شمارش تکرار کلمات مشترک و پیدا کردن پرتکرارترین آن‌ها
    most_common_word = Counter(common_words).most_common(1)[0][0]
    return most_common_word

def group_products_by_name(products: List[Dict]) -> Dict[int, str]:
    """
    لیستی از دیکشنری‌های محصولات را دریافت کرده و آن‌ها را بر اساس نامشان دسته‌بندی می‌کند.
    """
    product_names = [p['product_name'] for p in products]
    
    assignments = {}
    for product in products:
        product_id = product['product_id']
        product_name = product['product_name']
        
        best_category = find_best_category_for_product(product_name, product_names)
        assignments[product_id] = best_category
        
    return assignments

# --- برای تست مستقیم خود فایل ---
if __name__ == "__main__":
    sample_products_list = [
        {"product_id": 1, "product_name": "نوشابه کوکاکولا"},
        {"product_id": 2, "product_name": "کیک شکلاتی"},
        {"product_id": 3, "product_name": "قهوه فوری"},
        {"product_id": 4, "product_name": "کیف دوشی چرم"},
        {"product_id": 5, "product_name": "جامدادی پارچه ای"},
        {"product_id": 6, "product_name": "کیف پول مردانه"},
    ]
    
    product_groups = group_products_by_name(sample_products_list)
    
    for pid, category in product_groups.items():
        pname = next(p['product_name'] for p in sample_products_list if p['product_id'] == pid)
        print(f"Product: '{pname}'  ->  Category: '{category}'")