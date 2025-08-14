from django.urls import path
from . import views

urlpatterns = [
    path('balance/', views.get_balance, name='get_balance'),
    path('subscriptions/', views.get_subscriptions, name='get_subscriptions'),
    path('transactions/', views.transaction_status, name='list_transactions'),
    path('transactions/<str:transaction_id>/', views.transaction_status, name='transaction_status'),
]