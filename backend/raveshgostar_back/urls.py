from django.contrib import admin
from django.urls import path, include

from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # آدرس ادمین جنگو
    path('admin/', admin.site.urls),
    # آدرس‌های اپ form_builder (که شامل records هم هست)
    path('api/', include('form_builder.urls')),
    
    # آدرس‌های دریافت و تمدید توکن
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]