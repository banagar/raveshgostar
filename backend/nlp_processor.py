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
    
    final_entities = []
    for entity in raw_entities:
        if entity['score'] >= score_threshold:
            
            # ==================================================================
            # ۳. اصلاح نهایی: حذف کاراکترهای ## از کلمات استخراج شده
            # ==================================================================
            cleaned_word = entity['word'].replace("##", "").strip()
            # ==================================================================

            final_entities.append({
                "word": cleaned_word,
                "entity_group": entity['entity_group']
            })
            
    return final_entities


# برای تست مستقیم خود فایل
if __name__ == "__main__":
    sample_text = "3 چای به آقای احمدی 1 میلیون تومان"
    
    extracted = extract_entities(sample_text)
    print(f"موجودیت‌های استخراج شده از جمله نمونه:\n '{sample_text}'")
    print(extracted)
    # خروجی مورد انتظار:
    # [{'word': '3', 'entity_group': 'QUANTITY'}, {'word': 'چای', 'entity_group': 'PRODUCT'}, 
    #  {'word': 'آقای احمدی', 'entity_group': 'CUSTOMER'}, {'word': '1 میلیون تومان', 'entity_group': 'PRICE'}]