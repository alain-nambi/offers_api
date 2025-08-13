from django.urls import path
from . import views

urlpatterns = [
    path('', views.list_offers, name='list_offers'),
    path('<int:offer_id>/', views.offer_detail, name='offer_detail'),
    path('expiring/', views.expiring_offers, name='expiring_offers'),
    path('renew/', views.renew_offer, name='renew_offer'),
]