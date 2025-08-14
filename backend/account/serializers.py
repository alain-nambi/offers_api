from rest_framework import serializers
from .models import Account, Transaction
from offers.models import Offer


class AccountSerializer(serializers.ModelSerializer):
    """Serializer for Account model"""
    class Meta:
        model = Account
        fields = ['id', 'balance', 'created_at', 'updated_at']


class TransactionSerializer(serializers.ModelSerializer):
    """Serializer for Transaction model"""
    offer_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Transaction
        fields = ['id', 'transaction_id', 'offer', 'offer_details', 'amount', 'status', 'created_at', 'updated_at', 'completed_at']
    
    def get_offer_details(self, obj):
        offer = obj.offer
        return {
            'id': offer.id,
            'name': offer.name,
            'description': offer.description,
            'price': str(offer.price),
        }