# nlp_processor.py
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification

# آدرس مدل fine-tune شده خودمان
ner_model_name = "./final-ner-model" 

# لود کردن توکنایزر و مدل از مسیر جدید
tokenizer = AutoTokenizer.from_pretrained(ner_model_name)
model = AutoModelForTokenClassification.from_pretrained(ner_model_name)

# ساخت پایپ‌لاین NER با استراتژی تجمیع
ner_pipeline = pipeline(
    "ner", 
    model=model, 
    tokenizer=tokenizer,
    aggregation_strategy="simple"
)


def extract_entities(text: str):
    """
    موجودیت‌های مربوط به فروش را استخراج و پاک‌سازی نهایی می‌کند.
    """
    
    raw_entities = ner_pipeline(text)
    
    score_threshold = 0.60 
    
    # مرحله ۱: پاک‌سازی اولیه و فیلتر بر اساس امتیاز
    cleaned_entities = []
    for entity in raw_entities:
        if entity['score'] >= score_threshold:
            cleaned_word = entity['word'].replace("##", "").strip()
            cleaned_entities.append({
                "word": cleaned_word,
                "entity_group": entity['entity_group']
            })
    
    if not cleaned_entities:
        return []

    # ==================================================================
    # مرحله ۲: ادغام موجودیت‌های متوالی و همنوع (راه حل مشکل)
    # ==================================================================
    merged_entities = [cleaned_entities[0]]
    for current_entity in cleaned_entities[1:]:
        previous_entity = merged_entities[-1]
        
        # اگر موجودیت فعلی هم‌نوع قبلی بود
        if current_entity['entity_group'] == previous_entity['entity_group']:
            # کلمات را به هم می‌چسبانیم. برای CUSTOMER بدون فاصله و برای بقیه با فاصله
            if current_entity['entity_group'] == 'CUSTOMER':
                 previous_entity['word'] += current_entity['word']
            else:
                 previous_entity['word'] += " " + current_entity['word']
        else:
            # اگر نوعش متفاوت بود، به لیست نهایی اضافه‌اش می‌کنیم
            merged_entities.append(current_entity)
            
    return merged_entities


# برای تست مستقیم خود فایل
if __name__ == "__main__":
    sample_text = "یک خودرو به آقای احمدی ۴۰۰ میلیون تومان"
    
    extracted = extract_entities(sample_text)
    print(f"موجودیت‌های استخراج شده از جمله نمونه:\n '{sample_text}'")
    print(extracted)
    # خروجی مورد انتظار اصلاح شده:
    # [{'word': 'یک', 'entity_group': 'QUANTITY'}, {'word': 'قهوه', 'entity_group': 'PRODUCT'}, 
    #  {'word': 'آقای رضایی', 'entity_group': 'CUSTOMER'}, {'word': '۲۰ هزار تومان', 'entity_group': 'PRICE'}]