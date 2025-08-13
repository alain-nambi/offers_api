import pytest
from rest_framework import status
from django.utils import timezone
from datetime import timedelta


@pytest.mark.django_db
class TestAccountViews:
    def test_get_balance(self, authenticated_client, create_account):
        client, user = authenticated_client
        create_account(user, balance=75.50)
        url = '/api/v1/account/balance/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['balance']) == 75.50

    def test_get_balance_no_account(self, authenticated_client):
        client, user = authenticated_client
        url = '/api/v1/account/balance/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert float(response.data['balance']) == 0.00

    def test_get_subscriptions_empty(self, authenticated_client):
        client, user = authenticated_client
        url = '/api/v1/account/subscriptions/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_get_subscriptions_with_data(self, authenticated_client, create_offer):
        from offers.models import UserOffer
        
        client, user = authenticated_client
        offer = create_offer()
        
        # Create an active subscription
        UserOffer.objects.create(
            user=user,
            offer=offer,
            expiration_date=timezone.now() + timedelta(days=30),
            transaction_id='test-transaction-123',
            is_active=True
        )
        
        url = '/api/v1/account/subscriptions/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['offer_details']['name'] == offer.name

    def test_list_transactions_empty(self, authenticated_client):
        client, user = authenticated_client
        url = '/api/v1/account/transactions/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 0

    def test_get_transaction_status(self, authenticated_client, create_offer):
        from account.models import Transaction
        
        client, user = authenticated_client
        offer = create_offer()
        
        # Create a transaction
        transaction = Transaction.objects.create(
            user=user,
            offer=offer,
            transaction_id='test-transaction-456',
            amount=offer.price,
            status='PENDING'
        )
        
        url = f'/api/v1/account/transactions/{transaction.transaction_id}/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['transaction_id'] == transaction.transaction_id
        assert response.data['status'] == 'PENDING'