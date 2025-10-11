# backend/records/views.py

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
from rest_framework.filters import SearchFilter # ✅ این رو اضافه کن
from form_builder.models import Form, Field
from .models import RecordHeader, HeaderValue
from .serializers import (
    RecordHeaderDetailSerializer,
    RecordCreateUpdateSerializer
)
from .services import create_or_update_record

def is_record_referenced(record_header: RecordHeader) -> (bool, str):
    lookup_fields = Field.objects.filter(field_type='LOOKUP', lookup_form_id=record_header.form_id)
    
    for lookup_field in lookup_fields:
        is_referenced = HeaderValue.objects.filter(
            field=lookup_field,
            value_number=record_header.pk
        ).exists()
        
        if is_referenced:
            referencing_form = lookup_field.form
            return True, f"این رکورد در فرم '{referencing_form.name}' به عنوان مرجع استفاده شده است."

    return False, ""

class RecordViewSet(viewsets.ModelViewSet):
    # ✅ اضافه کردن قابلیت‌های فیلتر و جستجو
    filter_backends = [SearchFilter]
    search_fields = ['values__value_text', 'values__value_number']

    ordering = ['-created_at']

    def get_queryset(self):
        return RecordHeader.objects.filter(form_id=self.kwargs['form_pk'])\
            .prefetch_related('values', 'values__field') # ✅ بهینه‌سازی کوئری

    def get_serializer_class(self):
        # ✅ تغییر مهم: برای لیست هم از سریالایزر کامل استفاده می‌کنیم
        if self.action == 'list':
            return RecordHeaderDetailSerializer 
        if self.action in ['create', 'update', 'partial_update']:
            return RecordCreateUpdateSerializer
        return RecordHeaderDetailSerializer

    def create(self, request, *args, **kwargs):
        form = Form.objects.get(pk=self.kwargs['form_pk'])
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        record_header = create_or_update_record(form, serializer.validated_data)
        output_serializer = RecordHeaderDetailSerializer(record_header, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        form = instance.form
        # ✅ اصلاح اصلی: instance به سریالایزر پاس داده شد
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        record_header = create_or_update_record(form, serializer.validated_data, instance=instance)
        output_serializer = RecordHeaderDetailSerializer(record_header, context={'request': request})
        return Response(output_serializer.data, status=status.HTTP_200_OK)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        is_referenced, reason = is_record_referenced(instance)
        if is_referenced:
            raise ValidationError(f"این رکورد قابل حذف نیست. {reason}")
        
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)