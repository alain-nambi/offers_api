import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework import status
from unittest.mock import patch
from partner.models import PartnerTransaction
from offers.models import Offer


@pytest.mark.django_db
class TestPartnerAPI:
    def setup_method(self):
        """Setup method to initialize test data"""
        self.client = APIClient()
        
        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        
        # Create test offer
        self.offer = Offer.objects.create(
            name='Test Offer',
            description='Test offer description',
            price=29.99,
            duration_days=30
        )
    
    def test_activate_offer_success(self):
        """Test successful offer activation"""
        data = {
            'user_id': self.user.id,
            'offer_id': self.offer.id,
            'amount': '29.99'
        }
        
        response = self.client.post('/api/v1/partner/activate/', data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert 'reference' in response.data
        assert 'transaction_id' in response.data
        assert response.data['status'] == 'PENDING'
        assert response.data['message'] == 'Activation request received'
        
        # Check that the transaction was created
        assert PartnerTransaction.objects.filter(
            transaction_id=response.data['transaction_id']
        ).exists()
    
    def test_activate_offer_missing_fields(self):
        """Test offer activation with missing fields"""
        data = {
            'user_id': self.user.id,
            # Missing offer_id and amount
        }
        
        response = self.client.post('/api/v1/partner/activate/', data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert 'error' in response.data
    
    @patch('partner.views.uuid.uuid4')
    def test_validate_transaction_success(self, mock_uuid):
        """Test successful transaction validation"""
        # Create a test transaction
        transaction_id = 'test-transaction-id'
        reference = 'REF-TEST123'
        
        PartnerTransaction.objects.create(
            transaction_id=transaction_id,
            user=self.user,
            offer=self.offer,
            amount=29.99,
            reference=reference,
            status='PENDING'
        )
        
        response = self.client.get(f'/api/v1/partner/validate/{reference}/')
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['reference'] == reference
        assert response.data['transaction_id'] == transaction_id
        assert response.data['user_id'] == self.user.id
        assert response.data['offer_id'] == self.offer.id
        assert response.data['is_valid'] is True
    
    def test_validate_transaction_not_found(self):
        """Test validation of non-existent transaction"""
        reference = 'REF-NONEXISTENT'
        
        response = self.client.get(f'/api/v1/partner/validate/{reference}/')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert response.data['reference'] == reference
        assert response.data['is_valid'] is False
        assert response.data['error'] == 'Transaction not found'