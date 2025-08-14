import pytest
from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken


@pytest.mark.django_db
class TestAuthViews:
    def setup_method(self):
        """Setup method to create test user and client before each test."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com'
        )
        self.user.save()

    def test_login_success(self):
        """Test successful user login."""
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser',
            'password': 'testpass123'
        }, format='json')
        
        assert response.status_code == 200
        assert 'access' in response.data
        assert 'refresh' in response.data

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser',
            'password': 'wrongpass'
        }, format='json')
        
        assert response.status_code == 401

    def test_login_missing_credentials(self):
        """Test login with missing credentials."""
        response = self.client.post('/api/v1/auth/login/', {
            'username': 'testuser'
        }, format='json')
        
        assert response.status_code == 400

    def test_profile_authenticated(self):
        """Test accessing profile with valid authentication."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        response = self.client.get('/api/v1/auth/profile/')
        assert response.status_code == 200
        assert response.data['username'] == 'testuser'
        assert response.data['email'] == 'test@example.com'

    def test_profile_unauthenticated(self):
        """Test accessing profile without authentication."""
        response = self.client.get('/api/v1/auth/profile/')
        assert response.status_code == 401

    def test_logout(self):
        """Test user logout."""
        # Get token
        refresh = RefreshToken.for_user(self.user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        
        # Set credentials
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
        
        # Test logout
        response = self.client.post('/api/v1/auth/logout/', {
            'refresh': refresh_token
        }, format='json')
        
        assert response.status_code == 200
        assert response.data['message'] == 'Successfully logged out'