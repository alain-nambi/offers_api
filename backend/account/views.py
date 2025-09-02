from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from .models import Account, Transaction
from .serializers import AccountSerializer, TransactionSerializer
from offers.models import UserOffer
from offers.serializers import UserOfferSerializer


class SubscriptionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class TransactionPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_balance(request):
    """
    Return the current user balance.
    """
    account, created = Account.objects.get_or_create(user=request.user)
    serializer = AccountSerializer(account)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_subscriptions(request):
    """
    Return the list of currently active offers for the user with pagination.
    """
    user_offers = UserOffer.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('offer').order_by('id')
    
    paginator = SubscriptionPagination()
    paginated_offers = paginator.paginate_queryset(user_offers, request)
    serializer = UserOfferSerializer(paginated_offers, many=True)
    return paginator.get_paginated_response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_count_subscriptions(request):
    """
    Return the count of currently active offers for the user.
    """
    count = UserOffer.objects.filter(
        user=request.user,
        is_active=True
    ).count()
    return Response({'active_subscriptions_count': count}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def transaction_status(request, transaction_id=None):
    """
    Check the status of a specific transaction or list all transactions for the user.
    """
    if transaction_id:
        # Get specific transaction
        transaction = get_object_or_404(
            Transaction,
            transaction_id=transaction_id,
            user=request.user
        )
        serializer = TransactionSerializer(transaction)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        # List all transactions for the user with pagination and filtering
        status_filter = request.GET.get('status')
        transactions = Transaction.objects.filter(user=request.user).select_related('offer').order_by('-created_at')
        
        # Apply status filter if provided and not 'ALL'
        if status_filter and status_filter.upper() != 'ALL':
            transactions = transactions.filter(status=status_filter.upper())
        
        # Apply pagination
        paginator = TransactionPagination()
        paginated_transactions = paginator.paginate_queryset(transactions, request)
        serializer = TransactionSerializer(paginated_transactions, many=True)
        return paginator.get_paginated_response(serializer.data)