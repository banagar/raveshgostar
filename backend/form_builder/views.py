# backend/form_builder/views.py

from django.db.models import Max, Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Form, Field
from .serializers import FormSerializer, FormCreateUpdateSerializer, FieldSerializer

class FormViewSet(viewsets.ModelViewSet):
    queryset = Form.objects.all().prefetch_related('fields')
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return FormCreateUpdateSerializer
        return FormSerializer
        
class FieldViewSet(viewsets.ModelViewSet):
    serializer_class = FieldSerializer

    def get_queryset(self):
        return Field.objects.filter(form_id=self.kwargs['form_pk'])

    def perform_create(self, serializer):
        form = Form.objects.get(pk=self.kwargs['form_pk'])
        serializer.save(form=form)

    @action(detail=True, methods=['get'], url_path='suggest-auto-increment')
    def suggest_auto_increment(self, request, *args, **kwargs):
        field = self.get_object()
        if not field.has_auto_increment:
            return Response({"detail": "این فیلد از نوع افزایشی خودکار نیست."}, status=400)
        
        from records.models import HeaderValue
        
        max_value = HeaderValue.objects.filter(field=field).aggregate(max_val=Max('value_number'))['max_val']
        
        next_value = 1
        if max_value is not None:
            next_value = int(max_value) + 1
            
        return Response({"next_value": next_value})

    @action(detail=True, methods=['get'], url_path='search-lookup')
    # ✅ تابع search_lookup با نسخه جدید و هوشمند جایگزین می‌شود
    @action(detail=True, methods=['get'], url_path='search-lookup')
    def search_lookup(self, request, *args, **kwargs):
        field = self.get_object()
        if field.field_type != 'LOOKUP':
            return Response({"detail": "این فیلد از نوع لوکاپ نیست."}, status=400)

        lookup_form = field.lookup_form
        ref_field = field.lookup_reference_field
        disp_field = field.lookup_display_field

        if not all([lookup_form, ref_field, disp_field]):
            return Response({"detail": "تنظیمات لوکاپ برای این فیلد کامل نیست."}, status=400)
        
        search_query = request.query_params.get('q', '')
        
        from records.models import RecordHeader

        # شروع ساخت کوئری برای جستجو در فرم مرجع
        qs = RecordHeader.objects.filter(form=lookup_form).order_by('-created_at')

        # ✅ منطق جستجوی جدید و بهینه در سطح دیتابیس
        if search_query:
            # جستجو هم در فیلدهای متنی و هم در فیلدهای عددی
            qs = qs.filter(
                Q(values__field=ref_field, values__value_text__icontains=search_query) |
                Q(values__field=disp_field, values__value_text__icontains=search_query) |
                Q(values__field=ref_field, values__value_number__icontains=search_query) |
                Q(values__field=disp_field, values__value_number__icontains=search_query)
            ).distinct()

        results = []
        # محدود کردن به ۵۰ نتیجه برای جلوگیری از کندی
        for record in qs[:50]:
            try:
                ref_obj = record.values.get(field=ref_field)
                disp_obj = record.values.get(field=disp_field)

                ref_val = getattr(ref_obj, f"value_{ref_obj.field.field_type.lower()}", ref_obj.value_text)
                disp_val = getattr(disp_obj, f"value_{disp_obj.field.field_type.lower()}", disp_obj.value_text)

                # ✅ اصلاح فرمت اعداد: حذف صفرهای اضافی
                if ref_obj.field.field_type == 'NUMBER' and ref_val is not None:
                    # اگر عدد اعشاری نبود، به صورت عدد صحیح نمایش بده
                    ref_val = int(ref_val) if ref_val == int(ref_val) else ref_val

                combined_label = f"{ref_val} - {disp_val}"

                # ✅ ساختار جدید پاسخ برای پشتیبانی از قابلیت جدید فرانت‌اند
                results.append({
                    "value": record.pk,
                    "label": combined_label,
                    "display_value": disp_val,
                    "code_value": ref_val
                })
            except Exception:
                continue

        return Response(results)