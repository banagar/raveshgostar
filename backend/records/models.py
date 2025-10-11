# backend/records/models.py

from django.db import models
from form_builder.models import Form, Field

class RecordHeader(models.Model):
    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='records', verbose_name="فرم")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ثبت")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="تاریخ ویرایش")

    def __str__(self):
        return f"رکورد {self.id} از فرم {self.form.name}"

class RecordItem(models.Model):
    header = models.ForeignKey(RecordHeader, on_delete=models.CASCADE, related_name='items', verbose_name="هدر مربوطه")
    
    def __str__(self):
        return f"آیتم {self.id} از رکورد {self.header.id}"

class HeaderValue(models.Model):
    header = models.ForeignKey(RecordHeader, on_delete=models.CASCADE, related_name='values')
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='header_values')
    
    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(max_digits=20, decimal_places=5, null=True, blank=True)
    value_date_gregorian = models.DateField(null=True, blank=True)
    value_date_jalali = models.CharField(max_length=10, null=True, blank=True)

    class Meta:
        unique_together = [
            ('header', 'field'),
        ]

    def get_value(self):
        field_type = self.field.field_type
        if field_type in ['TEXT', 'LOOKUP_DISPLAY']: return self.value_text
        if field_type in ['NUMBER', 'LOOKUP']: return self.value_number
        if field_type == 'DATE': return self.value_date_jalali
        return None

class ItemValue(models.Model):
    item = models.ForeignKey(RecordItem, on_delete=models.CASCADE, related_name='values')
    field = models.ForeignKey(Field, on_delete=models.CASCADE, related_name='item_values')
    
    value_text = models.TextField(null=True, blank=True)
    value_number = models.DecimalField(max_digits=20, decimal_places=5, null=True, blank=True)
    value_date_gregorian = models.DateField(null=True, blank=True)
    value_date_jalali = models.CharField(max_length=10, null=True, blank=True)

    # ✅✅✅ این متد را به اینجا اضافه کنید ✅✅✅
    def get_value(self):
        field_type = self.field.field_type
        if field_type in ['TEXT', 'LOOKUP_DISPLAY']: return self.value_text
        if field_type in ['NUMBER', 'LOOKUP']: return self.value_number
        if field_type == 'DATE': return self.value_date_jalali
        return None

    class Meta:
        unique_together = ('item', 'field')