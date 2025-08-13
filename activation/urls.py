from django.urls import path
from . import views

urlpatterns = [
    path('', views.activate_offer, name='activate_offer'),
    path('status/<str:transaction_id>/', views.activation_status, name='activation_status'),
]