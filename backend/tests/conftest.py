import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from offers.models import Offer
from account.models import Account


@pytest.fixture
def api_client():
    """
    Fixture to provide an unauthenticated APIClient instance.
    
    This is a reusable Django REST Framework test client that can simulate
    HTTP requests (GET, POST, PUT, DELETE, etc.) to your API endpoints.
    It's useful for testing views without authentication or when authentication
    will be applied separately.
    
    Returns:
        APIClient: An instance of the DRF APIClient.
    """
    return APIClient()


@pytest.fixture
def create_user():
    """
    Parameterized fixture to create a Django User instance for testing.
    
    This allows tests to create users with custom username, password, and email.
    By default, it creates a standard test user, but any test can override these
    values when calling the fixture.

    Usage:
        user = create_user(username='custom', password='custompass', email='custom@example.com')

    Returns:
        function: A callable that creates and returns a User object.
    """
    def _create_user(username='testuser', password='testpass123', email='test@example.com'):
        return User.objects.create_user(username=username, password=password, email=email)
    return _create_user


@pytest.fixture
def authenticated_client(create_user):
    """
    Fixture to provide an APIClient instance that is authenticated using JWT.
    
    It first creates a test user via the create_user fixture, then generates a
    JWT access token using django-rest-framework-simplejwt. The client is then
    configured with the Authorization header containing the Bearer token.

    This is useful for testing endpoints that require authentication.

    Returns:
        tuple: A tuple containing:
            - APIClient: Authenticated client with JWT credentials.
            - User: The authenticated user instance.
    """
    user = create_user()
    client = APIClient()
    refresh = RefreshToken.for_user(user)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client, user


@pytest.fixture
def create_offer():
    """
    Parameterized fixture to create an Offer instance for testing.
    
    Offers typically represent subscription plans or products in the system.
    This fixture allows tests to create offers with specific attributes like
    name, price, duration, and description. Default values are provided for
    convenience.

    Usage:
        offer = create_offer(name='Premium Plan', price=29.99, duration_days=365)

    Returns:
        function: A callable that creates and returns an Offer object.
    """
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
    """
    Parameterized fixture to create an Account instance linked to a User.
    
    The Account model likely holds user-specific data such as balance.
    This fixture requires a user instance and optionally a balance amount,
    allowing tests to set up user financial states.

    Usage:
        account = create_account(user=some_user, balance=50.00)

    Returns:
        function: A callable that creates and returns an Account object.
    """
    def _create_account(user, balance=100.00):
        return Account.objects.create(user=user, balance=balance)
    return _create_account