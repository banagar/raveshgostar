# backend/form_builder/models.py

from django.db import models

class Form(models.Model):
    FORM_TYPE_CHOICES = [
        ('SINGLE_SECTION', 'یک‌بخشی (فقط هدر)'),
        ('DOUBLE_SECTION', 'دوبخشی (هدر + اقلام)'),
    ]

    code = models.CharField(max_length=50, unique=True, verbose_name="کد یکتای فرم")
    name = models.CharField(max_length=100, verbose_name="نام فرم")
    form_type = models.CharField(max_length=20, choices=FORM_TYPE_CHOICES, default='SINGLE_SECTION', verbose_name="نوع فرم")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="تاریخ ایجاد")
    display_order = models.PositiveIntegerField(default=10, verbose_name="ترتیب نمایش")
    color = models.CharField(max_length=7, default="#FFFFFF", verbose_name="کد رنگ هگزادسیمال")

    def __str__(self):
        return self.name

class Field(models.Model):
    SECTION_CHOICES = [
        ('HEADER', 'هدر'),
        ('ITEM', 'اقلام/ردیف‌ها'),
    ]
    FIELD_TYPE_CHOICES = [
        ('NUMBER', 'عددی'),
        ('TEXT', 'متنی'),
        ('DATE', 'تاریخی'),
        ('LOOKUP', 'لوکاپ'),
        ('LOOKUP_DISPLAY', 'لوکاپ نمایشی'),
    ]
    COMPUTATION_LEVEL_CHOICES = [
        ('ITEM', 'سطح آیتم'),
        ('AGGREGATE', 'سطح تجمعی (هدر)'),
        ('HEADER', 'سطح هدر'),
    ]

    # ✅ فیلد جدید
    section = models.CharField(max_length=10, choices=SECTION_CHOICES, default='HEADER', verbose_name="بخش فرم")

    form = models.ForeignKey(Form, on_delete=models.CASCADE, related_name='fields', verbose_name="فرم مربوطه")
    code = models.CharField(max_length=50, verbose_name="کد یکتای فیلد در فرم")
    name = models.CharField(max_length=100, verbose_name="نام فیلد")
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES, verbose_name="نوع فیلد")
    
    is_required = models.BooleanField(default=False, verbose_name="اجباری")
    is_unique = models.BooleanField(default=False, verbose_name="غیرتکراری")
    is_readonly_on_edit = models.BooleanField(default=False, verbose_name="غیرقابل ویرایش در حالت ویرایش")
    
    has_auto_increment = models.BooleanField(default=False, verbose_name="پیشنهاد افزایش خودکار دارد؟")
    is_computed = models.BooleanField(default=False, verbose_name="محاسباتی است؟")
    computation_formula = models.TextField(blank=True, null=True, verbose_name="فرمول محاسبه")
    computation_level = models.CharField(max_length=10, choices=COMPUTATION_LEVEL_CHOICES, null=True, blank=True, verbose_name="سطح محاسبه")
    computation_order = models.PositiveIntegerField(default=1, verbose_name="ترتیب محاسبه")

    lookup_form = models.ForeignKey(Form, on_delete=models.SET_NULL, null=True, blank=True, related_name='lookup_source_for', verbose_name="فرم مرجع (برای لوکاپ)")
    lookup_reference_field = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='+', verbose_name="فیلد مرجع (برای لوکاپ)")
    lookup_display_field = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='+', verbose_name="فیلد نمایشی (برای لوکاپ)")

    class Meta:
        unique_together = ('form', 'code')

    def __str__(self):
        return f"{self.form.name} - {self.name}"