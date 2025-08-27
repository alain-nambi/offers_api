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
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import json


@swagger_auto_schema(
    method='post',
    operation_description="Authenticate user and return JWT tokens",
    operation_summary="User Login",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['username', 'password'],
        properties={
            'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
            'password': openapi.Schema(type=openapi.TYPE_STRING, description='Password'),
        },
    ),
    responses={
        200: openapi.Response(
            description="Login successful",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token'),
                    'access': openapi.Schema(type=openapi.TYPE_STRING, description='Access token'),
                }
            )
        ),
        400: openapi.Response(description="Bad request - missing username or password"),
        401: openapi.Response(description="Invalid credentials"),
    },
    tags=['Authentication']
)
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


@swagger_auto_schema(
    method='get',
    operation_description="Get current user profile information including account balance",
    operation_summary="Get User Profile",
    responses={
        200: openapi.Response(
            description="User profile retrieved successfully",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID'),
                    'username': openapi.Schema(type=openapi.TYPE_STRING, description='Username'),
                    'email': openapi.Schema(type=openapi.TYPE_STRING, description='Email address'),
                    'first_name': openapi.Schema(type=openapi.TYPE_STRING, description='First name'),
                    'last_name': openapi.Schema(type=openapi.TYPE_STRING, description='Last name'),
                    'date_joined': openapi.Schema(type=openapi.TYPE_STRING, format=openapi.FORMAT_DATETIME, description='Date joined'),
                    'account': openapi.Schema(
                        type=openapi.TYPE_OBJECT,
                        properties={
                            'balance': openapi.Schema(type=openapi.TYPE_NUMBER, description='Account balance')
                        }
                    )
                }
            )
        ),
        401: openapi.Response(description="Authentication required"),
    },
    tags=['Authentication']
)
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


@swagger_auto_schema(
    method='post',
    operation_description="Logout user by blacklisting the refresh token",
    operation_summary="User Logout",
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['refresh'],
        properties={
            'refresh': openapi.Schema(type=openapi.TYPE_STRING, description='Refresh token to blacklist'),
        },
    ),
    responses={
        200: openapi.Response(
            description="Logout successful",
            schema=openapi.Schema(
                type=openapi.TYPE_OBJECT,
                properties={
                    'message': openapi.Schema(type=openapi.TYPE_STRING, description='Success message'),
                }
            )
        ),
        400: openapi.Response(description="Invalid token"),
        401: openapi.Response(description="Authentication required"),
    },
    tags=['Authentication']
)
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