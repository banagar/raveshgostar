# backend/form_builder/serializers.py

from rest_framework import serializers
from .models import Form, Field
from django.db.models import Q

class FieldSerializer(serializers.ModelSerializer):
    can_delete = serializers.SerializerMethodField()
    delete_reasons = serializers.SerializerMethodField()

    class Meta:
        model = Field
        fields = [
            'id', 'form', 'name', 'code', 'field_type', 'is_required', 'is_unique', 
            'is_readonly_on_edit', 'has_auto_increment', 'is_computed', 
            'computation_formula', 'computation_level', 'computation_order',
            'lookup_form', 'lookup_reference_field', 'section', 'lookup_display_field',
            'can_delete', 'delete_reasons'
        ]
        extra_kwargs = { 'form': {'read_only': True} }

    # ✅✅✅ این سه تابع جا افتاده بودند ✅✅✅
    def get_can_delete(self, obj: Field) -> bool:
        reasons = self._get_delete_reasons(obj)
        return not reasons

    def get_delete_reasons(self, obj: Field) -> list:
        return self._get_delete_reasons(obj)

    def _get_delete_reasons(self, obj: Field) -> list:
        reasons = []
        # شرط ۱: فرم نباید هیچ رکوردی داشته باشد
        if obj.form.records.exists():
            reasons.append("فرم دارای رکورد ثبت شده است.")
        
        # شرط ۲: این فیلد نباید در هیچ فیلد لوکاپ دیگری استفاده شده باشد
        is_used_in_lookup = Field.objects.filter(
            Q(lookup_reference_field=obj) | Q(lookup_display_field=obj)
        ).exclude(pk=obj.pk).exists()

        if is_used_in_lookup:
            reasons.append("این فیلد در تنظیمات یک فیلد لوکاپ دیگر استفاده شده است.")
            
        return reasons
    # --- پایان توابع جا افتاده ---

    def validate(self, data):
        field_type = data.get('field_type')

        # قانون برای فیلد لوکاپ اصلی
        if field_type == 'LOOKUP':
            if not data.get('lookup_form') or not data.get('lookup_reference_field') or not data.get('lookup_display_field'):
                raise serializers.ValidationError("برای فیلدهای نوع لوکاپ، تعیین فرم مرجع، فیلد مرجع و فیلد نمایشی اجباری است.")
        
        # قانون جدید و ساده‌تر برای فیلد لوکاپ نمایشی
        elif field_type == 'LOOKUP_DISPLAY':
            if not data.get('lookup_reference_field'):
                raise serializers.ValidationError("برای فیلدهای نوع لوکاپ نمایشی، تعیین فیلد لوکاپ وابسته اجباری است.")

        return data


class FormSerializer(serializers.ModelSerializer):
    fields = FieldSerializer(many=True, read_only=True)
    record_count = serializers.SerializerMethodField()
    last_record_date = serializers.SerializerMethodField()

    class Meta:
        model = Form
        fields = [
            'id', 'name', 'code', 'form_type', 'display_order', 'color', 
            'created_at', 'fields', 'record_count', 'last_record_date'
        ]

    def get_record_count(self, obj):
        return obj.records.count()

    def get_last_record_date(self, obj):
        last_record = obj.records.order_by('-created_at').first()
        if last_record:
            return last_record.created_at
        return None


class FormCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Form
        fields = ['name', 'code', 'form_type', 'display_order', 'color']