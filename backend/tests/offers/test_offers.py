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
        
        # Create multiple test offers to test pagination
        self.offers = []
        for i in range(15):
            offer = Offer.objects.create(
                name=f'Test Offer {i+1}',
                description=f'Test offer description {i+1}',
                price=10.0 + i,
                duration_days=30 + i
            )
            self.offers.append(offer)
        
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
        # Check that response contains pagination fields
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data
        # By default, we should get 10 items per page
        assert len(response.data['results']) == 10
        assert response.data['count'] == 15

    def test_list_offers_with_page_size(self):
        """Test listing offers with custom page size."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/offers/?page_size=5')
        assert response.status_code == 200
        # Check that response contains pagination fields
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data
        # Should get 5 items per page
        assert len(response.data['results']) == 5
        assert response.data['count'] == 15

    def test_list_offers_second_page(self):
        """Test listing offers on second page."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/offers/?page=2')
        assert response.status_code == 200
        # Check that response contains pagination fields
        assert 'count' in response.data
        assert 'next' in response.data
        assert 'previous' in response.data
        assert 'results' in response.data
        # Should get 5 items on second page (10 items total, 10 on first page)
        assert len(response.data['results']) == 5
        assert response.data['count'] == 15
        assert response.data['previous'] is not None

    def test_offer_detail(self):
        """Test getting specific offer details."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get(f'/api/v1/offers/{self.offers[0].id}/')
        assert response.status_code == 200
        assert response.data['name'] == 'Test Offer 1'

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
            'offer_id': self.offers[0].id
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
            'offer_id': self.offers[0].id
        }, format='json')
        
        assert response.status_code == 400
        assert response.data['error'] == 'Insufficient balance'