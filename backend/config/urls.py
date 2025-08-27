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
      description="""
      A comprehensive RESTful API for managing subscription offers and activations.
      
      ## Features
      - **User Authentication**: JWT-based authentication with refresh tokens
      - **Offer Management**: Browse and manage subscription offers
      - **Account Management**: Balance checking and subscription management
      - **Asynchronous Activation**: Background processing for offer activation
      - **Real-time Status Tracking**: Transaction status monitoring
      - **Partner Integration**: API for partner systems
      
      ## Authentication
      Most endpoints require authentication. Use the `/api/v1/auth/login/` endpoint to obtain access tokens.
      Include the access token in the Authorization header: `Bearer <access_token>`
      
      ## Rate Limiting
      API requests are rate-limited to ensure fair usage and system stability.
      """,
      terms_of_service="https://www.offersapi.com/terms/",
      contact=openapi.Contact(
         name="Offers API Support",
         email="support@offersapi.com",
         url="https://www.offersapi.com/support/"
      ),
      license=openapi.License(name="MIT License"),
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
    
    # API Documentation
    path('swagger/', schema_view.with_ui(
        'swagger', 
        cache_timeout=0
    ), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui(
        'redoc', 
        cache_timeout=0
    ), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(
        cache_timeout=0
    ), name='schema-json'),
    path('swagger.yaml', schema_view.without_ui(
        cache_timeout=0
    ), name='schema-yaml'),
    
    # API root endpoint
    path('api/v1/', schema_view.with_ui(
        'swagger', 
        cache_timeout=0
    ), name='api-root'),
]