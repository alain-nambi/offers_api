from django.urls import path
from . import views

urlpatterns = [
    path('activate/', views.activate_offer, name='partner_activate'),
    path('validate/<str:reference>/', views.validate_transaction, name='partner_validate'),
]