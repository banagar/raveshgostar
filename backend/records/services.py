# backend/records/services.py

import jdatetime
from decimal import Decimal, InvalidOperation
from django.db import transaction, IntegrityError
from rest_framework.exceptions import ValidationError

from form_builder.models import Form
from .models import RecordHeader, HeaderValue, RecordItem, ItemValue

def _set_field_value(instance, field, value):
    if value is None or str(value).strip() == '': return
    
    try:
        if field.field_type in ['TEXT', 'LOOKUP_DISPLAY']:
            instance.value_text = str(value)
        elif field.field_type in ['NUMBER', 'LOOKUP']:
            instance.value_number = Decimal(value)
        elif field.field_type == 'DATE':
            # ۱. رشته تاریخ ورودی را از هرگونه اطلاعات اضافه (مثل ساعت) پاک می‌کنیم
            date_str = str(value).split('T')[0]
            
            # ۲. رشته را با jdatetime به عنوان یک تاریخ شمسی معتبر پارس می‌کنیم
            jalali_date_obj = jdatetime.datetime.strptime(date_str, '%Y-%m-%d').date()
            
            # ۳. آبجکت شمسی را به میلادی تبدیل کرده و در فیلد میلادی ذخیره می‌کنیم
            instance.value_date_gregorian = jalali_date_obj.togregorian()
            
            # ۴. رشته شمسی را با فرمت صحیح در فیلد شمسی ذخیره می‌کنیم
            instance.value_date_jalali = jalali_date_obj.strftime('%Y/%m/%d')
            
    except (ValueError, TypeError, InvalidOperation) as e:
        raise ValidationError(f"مقدار '{value}' برای فیلد '{field.name}' نامعتبر است: {e}")


@transaction.atomic
def create_or_update_record(form: Form, validated_data: dict, instance: RecordHeader = None) -> RecordHeader:
    is_update = instance is not None
    header_data = validated_data.get('header_values', {})
    items_data = validated_data.get('items', [])
    
    record_header = instance or RecordHeader.objects.create(form=form)

    if instance:
        record_header.values.all().delete()
        if form.form_type == 'DOUBLE_SECTION':
            ItemValue.objects.filter(item__header=record_header).delete()
            record_header.items.all().delete()

    fields_map = {f.code: f for f in form.fields.all()}
    
    # ❌ حلقه اعتبارسنجی اضافی و پراشتباه به طور کامل حذف شد.

    try:
        # ذخیره مقادیر هدر
        for code, value in header_data.items():
            if code in fields_map and value is not None and str(value).strip() != '':
                field = fields_map[code]
                value_obj = HeaderValue(header=record_header, field=field)
                _set_field_value(value_obj, field, value)
                value_obj.save()

        # ذخیره مقادیر اقلام
        if form.form_type == 'DOUBLE_SECTION' and items_data:
            for item_dict in items_data:
                if not item_dict: continue
                record_item = RecordItem.objects.create(header=record_header)
                for code, value in item_dict.items():
                    if code in fields_map and value is not None and str(value).strip() != '':
                        field = fields_map[code]
                        item_value_obj = ItemValue(item=record_item, field=field)
                        _set_field_value(item_value_obj, field, value)
                        item_value_obj.save()

    except IntegrityError:
        # ✅ اگر دیتابیس (که دیگر اشتباه نمی‌کند) خطای یکتا بودن داد، آن را به پیغام صحیح تبدیل می‌کنیم
        raise ValidationError("یک یا چند مقدار از فیلدهای یکتا (unique) تکراری است.")
    
    return record_header