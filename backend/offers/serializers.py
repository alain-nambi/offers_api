from rest_framework import serializers
from .models import Offer, UserOffer


class OfferSerializer(serializers.ModelSerializer):
    """Serializer for Offer model"""
    class Meta:
        model = Offer
        fields = ['id', 'name', 'description', 'price', 'duration_days', 'is_active', 'created_at', 'updated_at']


class UserOfferSerializer(serializers.ModelSerializer):
    """Serializer for UserOffer model"""
    offer_details = OfferSerializer(source='offer', read_only=True)
    
    class Meta:
        model = UserOffer
        fields = ['id', 'offer', 'offer_details', 'activation_date', 'expiration_date', 'is_active', 'transaction_id']