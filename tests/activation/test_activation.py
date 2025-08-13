import pytest
from rest_framework import status
from unittest.mock import patch


@pytest.mark.django_db
class TestActivationViews:
    @patch('activation.views.process_activation.delay')
    def test_activate_offer_success(self, mock_process_activation, authenticated_client, create_offer, create_account):
        mock_process_activation.return_value = None
        
        client, user = authenticated_client
        account = create_account(user, balance=50.00)
        offer = create_offer(name='Activation Offer', price=20.00, duration_days=30)
        
        url = '/api/v1/activation/'
        data = {
            'offer_id': offer.id
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_202_ACCEPTED
        assert 'transaction_id' in response.data
        assert response.data['status'] == 'PENDING'
        
        # Check that balance was deducted
        account.refresh_from_db()
        assert float(account.balance) == 30.00  # 50 - 20
        
        # Check that process_activation was called
        mock_process_activation.assert_called_once()

    def test_activate_offer_insufficient_balance(self, authenticated_client, create_offer, create_account):
        client, user = authenticated_client
        account = create_account(user, balance=5.00)  # Not enough for 20.00 offer
        offer = create_offer(name='Expensive Offer', price=20.00, duration_days=30)
        
        url = '/api/v1/activation/'
        data = {
            'offer_id': offer.id
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'Insufficient balance'

    def test_activate_offer_not_found(self, authenticated_client, create_account):
        client, user = authenticated_client
        account = create_account(user, balance=50.00)
        
        url = '/api/v1/activation/'
        data = {
            'offer_id': 999  # Non-existent offer
        }
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_activate_offer_missing_id(self, authenticated_client, create_account):
        client, user = authenticated_client
        account = create_account(user, balance=50.00)
        
        url = '/api/v1/activation/'
        data = {}  # Missing offer_id
        
        response = client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data['error'] == 'offer_id is required'

    def test_activation_status(self, authenticated_client, create_offer):
        from account.models import Transaction
        from activation.views import uuid
        
        client, user = authenticated_client
        offer = create_offer()
        
        # Create a transaction
        transaction_id = str(uuid.uuid4())
        Transaction.objects.create(
            user=user,
            offer=offer,
            transaction_id=transaction_id,
            amount=offer.price,
            status='PROCESSING'
        )
        
        url = f'/api/v1/activation/status/{transaction_id}/'
        
        response = client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert response.data['transaction_id'] == transaction_id
        assert response.data['status'] == 'PROCESSING'