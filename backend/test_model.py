# backend/test_model.py
from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification

def test_fine_tuned_model(text_to_test):
    model_path = "./final-ner-model"

    try:
        tokenizer = AutoTokenizer.from_pretrained(model_path)
        model = AutoModelForTokenClassification.from_pretrained(model_path)
    except Exception as e:
        print(f"خطا در بارگذاری مدل: {e}")
        return None

    ner_pipeline = pipeline("ner", model=model, tokenizer=tokenizer, ignore_labels=[])
    ner_results = ner_pipeline(text_to_test)
    return ner_results

if __name__ == "__main__":
    sample_text = "برای آقای رضایی یک قهوه به قیمت ۲۰ هزار تومان یک نوشابه به قیمت 50 هزار تومن و 3 چیپس به قیمت ۲۰ هزار تومن ثبت کن"
    results = test_fine_tuned_model(sample_text)
    if results:
        print(f"متن ورودی: {sample_text}\n")
        serializable_results = []
        for entity in results:
            serializable_entity = {
                "entity": entity["entity"],
                "score": float(entity["score"]),
                "word": entity["word"],
                "start": int(entity["start"]),
                "end": int(entity["end"]),
            }
            serializable_results.append(serializable_entity)
        print("\n--- جزئیات هر توکن ---")
        for entity in results:
            print(
                f"توکن: {entity['word']:<15} | "
                f"لیبل: {entity['entity']:<15} | "
                f"امتیاز: {entity['score']:.4f}"
            )