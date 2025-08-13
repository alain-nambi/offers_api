from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
import uuid
from datetime import datetime, timedelta
from celery import current_task
from .tasks import process_activation
from offers.models import Offer, UserOffer
from account.models import Account, Transaction
from account.serializers import TransactionSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_offer(request):
    """
    Starts the offer activation process for the connected user.
    """
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verification of offer existence
    offer = get_object_or_404(Offer, id=offer_id, is_active=True)
    
    # User balance verification
    account, created = Account.objects.get_or_create(user=request.user)
    
    if account.balance < offer.price:
        return Response(
            {'error': 'Insufficient balance'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Deduction of offer cost from balance
    account.balance -= offer.price
    account.save()
    
    # Generation of a unique transaction_id
    transaction_id = str(uuid.uuid4())
    
    # Create transaction with PENDING status
    transaction = Transaction.objects.create(
        user=request.user,
        offer=offer,
        transaction_id=transaction_id,
        amount=offer.price,
        status='PENDING'
    )
    
    # Create a pending user offer
    expiration_date = datetime.now() + timedelta(days=offer.duration_days)
    
    user_offer = UserOffer.objects.create(
        user=request.user,
        offer=offer,
        expiration_date=expiration_date,
        transaction_id=transaction_id,
        is_active=False  # Will be activated after processing
    )
    
    # Sending a task to a Celery worker via Redis for background processing
    process_activation.delay(transaction_id)
    
    # Return an immediate response (202 Accepted) with the transaction_id for tracking
    return Response(
        {
            'transaction_id': transaction_id,
            'message': 'Activation process started',
            'status': 'PENDING'
        }, 
        status=status.HTTP_202_ACCEPTED
    )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def activation_status(request, transaction_id):
    """
    Check the status of a specific activation transaction.
    """
    transaction = get_object_or_404(
        Transaction,
        transaction_id=transaction_id,
        user=request.user
    )
    
    serializer = TransactionSerializer(transaction)
    return Response(serializer.data, status=status.HTTP_200_OK)