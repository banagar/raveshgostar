# form_builder/admin.py

from django.contrib import admin
from .models import Form, Field

@admin.register(Form)
class FormAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'form_type', 'display_order', 'color')
    list_filter = ('form_type',)
    search_fields = ('name', 'code')
    ordering = ('display_order', 'name')

@admin.register(Field)
class FieldAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'form', 'field_type', 'is_required', 'computation_order')
    list_filter = ('form', 'field_type', 'is_computed')
    search_fields = ('name', 'code')
    ordering = ('form', 'computation_order', 'name')