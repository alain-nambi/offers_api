import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from offers.models import Offer
from account.models import Account


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def create_user():
    def _create_user(username='testuser', password='testpass123', email='test@example.com'):
        return User.objects.create_user(username=username, password=password, email=email)
    return _create_user


@pytest.fixture
def authenticated_client(create_user):
    user = create_user()
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client, user


@pytest.fixture
def create_offer():
    def _create_offer(name='Test Offer', price=10.00, duration_days=30):
        return Offer.objects.create(
            name=name,
            description='Test offer description',
            price=price,
            duration_days=duration_days,
            is_active=True
        )
    return _create_offer


@pytest.fixture
def create_account():
    def _create_account(user, balance=100.00):
        return Account.objects.create(user=user, balance=balance)
    return _create_account