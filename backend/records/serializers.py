# backend/records/serializers.py

from rest_framework import serializers
from .models import RecordHeader, RecordItem, HeaderValue, ItemValue
from form_builder.models import Field
from django.db.models import Q
from decimal import Decimal

class HeaderValueSerializer(serializers.ModelSerializer):
    field_code = serializers.CharField(source='field.code')
    value = serializers.SerializerMethodField()
    lookup_label = serializers.SerializerMethodField()

    class Meta:
        model = HeaderValue
        fields = ['field_code', 'value', 'lookup_label']

    def get_value(self, obj):
        field_type = obj.field.field_type

        # ✅ منطق جدید برای فیلد لوکاپ
        if field_type == 'LOOKUP':
            if obj.value_number is None:
                return None
            try:
                ref_record = RecordHeader.objects.get(pk=int(obj.value_number))
                ref_field = obj.field.lookup_reference_field
                ref_val_obj = ref_record.values.get(field=ref_field)
                # مقدار فیلد مرجع (کد) را برمی‌گردانیم
                return ref_val_obj.get_value()
            except:
                return obj.value_number # بازگشت به ID در صورت بروز خطا

        # بقیه فیلدها بدون تغییر
        if field_type in ['TEXT', 'LOOKUP_DISPLAY']: return obj.value_text
        if field_type == 'NUMBER': return obj.value_number
        if field_type == 'DATE': return obj.value_date_gregorian
        return None

    def get_lookup_label(self, obj):
        # ✅ مقدار value_number حالا همیشه ID رکورد مرجع است
        if obj.field.field_type == 'LOOKUP' and obj.value_number is not None:
            try:
                # ✅ pk=int(obj.value_number) حالا به درستی کار می‌کند
                ref_record = RecordHeader.objects.get(pk=int(obj.value_number))
                ref_field = obj.field.lookup_reference_field
                disp_field = obj.field.lookup_display_field
                if not ref_field or not disp_field: return str(obj.value_number)

                ref_val_obj = ref_record.values.get(field=ref_field)
                disp_val_obj = ref_record.values.get(field=disp_field)

                ref_val = ref_val_obj.get_value()
                disp_val = disp_val_obj.get_value()
                
                if ref_val_obj.field.field_type == 'NUMBER' and ref_val is not None:
                    ref_val = int(ref_val) if ref_val == int(ref_val) else ref_val

                return f"{ref_val} - {disp_val}"
            except Exception:
                raw_val = obj.get_value()
                if isinstance(raw_val, (int, float)) and raw_val is not None and raw_val == int(raw_val):
                    return str(int(raw_val))
                return str(raw_val)
        return None

class ItemValueSerializer(HeaderValueSerializer):
    class Meta:
        model = ItemValue
        fields = ['field_code', 'value', 'lookup_label']

class RecordItemSerializer(serializers.ModelSerializer):
    values = ItemValueSerializer(many=True, read_only=True)

    class Meta:
        model = RecordItem
        fields = ['id', 'values']

class RecordHeaderListSerializer(serializers.ModelSerializer):
    can_delete = serializers.SerializerMethodField()
    delete_reasons = serializers.SerializerMethodField()

    class Meta:
        model = RecordHeader
        fields = ['id', 'created_at', 'updated_at', 'can_delete', 'delete_reasons']

    # ✅✅✅ این دو متد با منطق صحیح و نهایی جایگزین شدند ✅✅✅
    def get_can_delete(self, obj: RecordHeader) -> bool:
        # بررسی می‌کند که آیا این رکورد در جای دیگری به عنوان مرجع استفاده شده است یا خیر
        pk_as_decimal = Decimal(obj.pk)

        # جستجو در مقادیر هدر
        is_referenced_in_header = HeaderValue.objects.filter(
            field__field_type='LOOKUP',
            value_number=pk_as_decimal
        ).exists()

        # جستجو در مقادیر اقلام
        is_referenced_in_item = ItemValue.objects.filter(
            field__field_type='LOOKUP',
            value_number=pk_as_decimal
        ).exists()
        
        # اگر در هر کدام از این دو جدول پیدا شد، یعنی قابل حذف نیست
        return not (is_referenced_in_header or is_referenced_in_item)

    def get_delete_reasons(self, obj: RecordHeader) -> list:
        reasons = []
        if not self.get_can_delete(obj):
            reasons.append("این رکورد قابل حذف نیست زیرا در جای دیگری به عنوان مرجع لوکاپ استفاده شده است.")
        return reasons

class RecordHeaderDetailSerializer(RecordHeaderListSerializer):
    values = HeaderValueSerializer(many=True, read_only=True)
    items = RecordItemSerializer(many=True, read_only=True)

    class Meta(RecordHeaderListSerializer.Meta):
        fields = RecordHeaderListSerializer.Meta.fields + ['values', 'items']


class RecordCreateUpdateSerializer(serializers.Serializer):
    header_values = serializers.DictField(child=serializers.CharField(allow_blank=True, allow_null=True), required=False)
    items = serializers.ListField(child=serializers.DictField(child=serializers.CharField(allow_blank=True, allow_null=True)), required=False)

    def validate(self, data):
        """
        این متد مقادیر فیلدهایی که is_unique=True دارند را کنترل می‌کند.
        """
        header_data = data.get('header_values', {})
        form = self.context['view'].get_object().form if self.instance else self.context['view'].get_queryset().model.form.field.related_model.objects.get(pk=self.context['view'].kwargs['form_pk'])
        
        # پیدا کردن فیلدهایی که باید غیرتکراری باشند
        unique_fields = Field.objects.filter(form=form, is_unique=True, section='HEADER')

        for field in unique_fields:
            value = header_data.get(field.code)
            
            # اگر مقداری برای فیلد یکتا ارسال نشده بود، بررسی نمی‌کنیم
            if value is None or str(value).strip() == '':
                continue

            # ساخت کوئری برای جستجوی مقدار تکراری
            query = Q(field=field)
            if field.field_type == 'NUMBER':
                query &= Q(value_number=value)
            else: # برای بقیه انواع مثل TEXT, LOOKUP و ...
                query &= Q(value_text=value)
            
            # شروع جستجو برای مقدار تکراری
            queryset = HeaderValue.objects.filter(query)

            # اگر در حالت ویرایش هستیم، رکورد فعلی را از جستجو حذف می‌کنیم
            if self.instance:
                queryset = queryset.exclude(header=self.instance)

            if queryset.exists():
                raise serializers.ValidationError(
                    f"مقدار '{value}' برای فیلد '{field.name}' تکراری است و قبلاً ثبت شده است."
                )

        return data