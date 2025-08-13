from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Account, Transaction
from .serializers import AccountSerializer, TransactionSerializer
from offers.models import UserOffer
from offers.serializers import UserOfferSerializer


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
    Return the list of currently active offers for the user.
    """
    user_offers = UserOffer.objects.filter(
        user=request.user,
        is_active=True
    ).select_related('offer')
    
    serializer = UserOfferSerializer(user_offers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


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
        # List all transactions for the user with optional filtering
        status_filter = request.GET.get('status')
        transactions = Transaction.objects.filter(user=request.user)
        
        if status_filter:
            transactions = transactions.filter(status=status_filter)
            
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)