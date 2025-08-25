import logging
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.cache import cache
from account.models import Account
import json


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Authenticate user by credentials, generate and return a JWT.
    The token is cached in Redis.
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response(
            {'error': 'Username and password are required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response(
            {'error': 'Invalid credentials'}, 
            status=status.HTTP_401_UNAUTHORIZED
        )
    
    # Generate tokens
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Cache the token in Redis with user info for 24 hours
    user_data = {
        'id': user.id,
        'username': user.username,
        'email': user.email,
    }
    cache.set(f"token_{access_token}", json.dumps(user_data), 86400)
    
    return Response({
        'refresh': str(refresh),
        'access': access_token,
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Retrieve information of the connected user.
    """
    user = request.user
    
    # Get user account information
    try:
        account = Account.objects.get(user=user)
        account_data = {
            'balance': float(account.balance)
        }
        
        logging.info(f"Retrieved account for user {user.username}: {account_data}")
    except Account.DoesNotExist:
        account_data = {
            'balance': 0.0
        }
    
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'date_joined': user.date_joined,
        'account': account_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Invalidate the token.
    """
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        
        # Remove from cache
        cache.delete(f"token_{request.META.get('HTTP_AUTHORIZATION', '').split(' ')[1]}")
        
        return Response(
            {'message': 'Successfully logged out'}, 
            status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(
            {'error': 'Invalid token'}, 
            status=status.HTTP_400_BAD_REQUEST
        )