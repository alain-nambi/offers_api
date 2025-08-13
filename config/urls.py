"""
URL Configuration for Offers API
"""

from django.contrib import admin
from django.urls import path, include
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi

schema_view = get_schema_view(
   openapi.Info(
      title="Offers API",
      default_version='v1',
      description="API for managing offer bundles activation (Internet, TV, etc.)",
      terms_of_service="https://www.google.com/policies/terms/",
      contact=openapi.Contact(email="contact@offersapi.local"),
      license=openapi.License(name="BSD License"),
   ),
   public=True,
   permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('authentication.urls')),
    path('api/v1/offers/', include('offers.urls')),
    path('api/v1/account/', include('account.urls')),
    path('api/v1/activation/', include('activation.urls')),
    path('api/v1/partner/', include('partner.urls')),
    path('swagger/', schema_view.with_ui(
        'swagger', 
        cache_timeout=0
    ), name='schema-swagger-ui'),
]