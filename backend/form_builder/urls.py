# backend/form_builder/urls.py

from django.urls import path, include
from rest_framework_nested import routers
from .views import FormViewSet, FieldViewSet
from records.views import RecordViewSet

router = routers.DefaultRouter()
router.register(r'forms', FormViewSet, basename='form')

forms_router = routers.NestedSimpleRouter(router, r'forms', lookup='form')
forms_router.register(r'fields', FieldViewSet, basename='form-fields')
forms_router.register(r'records', RecordViewSet, basename='form-records')

urlpatterns = [
    path('', include(router.urls)),
    path('', include(forms_router.urls)),
]