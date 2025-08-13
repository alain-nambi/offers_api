import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from offers.models import Offer
from account.models import Account

@pytest.mark.django_db
class TestOfferViews:
    def setup_method(self):
        """Setup method to create test data before each test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.user.save()
        
        # Create test offer
        self.offer = Offer.objects.create(
            name='Test Offer',
            description='Test offer description',
            price=10.0,
            duration_days=30
        )
        
        # Create account with balance
        self.account = Account.objects.create(
            user=self.user,
            balance=50.0
        )

    def test_list_offers(self):
        """Test listing all offers."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/offers/')
        assert response.status_code == 200
        assert len(response.data) >= 1

    def test_offer_detail(self):
        """Test getting specific offer details."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get(f'/api/v1/offers/{self.offer.id}/')
        assert response.status_code == 200
        assert response.data['name'] == 'Test Offer'

    def test_offer_detail_not_found(self):
        """Test getting non-existent offer."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/offers/99999/')
        assert response.status_code == 404

    def test_expiring_offers_empty(self):
        """Test getting expiring offers when there are none."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/offers/expiring/')
        assert response.status_code == 200
        assert response.data == []

    def test_renew_offer_success(self):
        """Test successfully renewing an offer."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.post('/api/v1/offers/renew/', {
            'offer_id': self.offer.id
        }, format='json')
        
        # Should be 202 Accepted since it's an async operation
        assert response.status_code == 202
        assert 'message' in response.data
        assert 'transaction_id' in response.data

    def test_renew_offer_insufficient_balance(self):
        """Test renewing an offer with insufficient balance."""
        # Set account balance to 0
        self.account.balance = 0
        self.account.save()
        
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.post('/api/v1/offers/renew/', {
            'offer_id': self.offer.id
        }, format='json')
        
        assert response.status_code == 400
        assert response.data['error'] == 'Insufficient balance'