from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
import uuid
from datetime import datetime, timedelta
from celery import current_task
from .tasks import process_activation
from offers.models import Offer, UserOffer
from account.models import Account, Transaction
from account.serializers import TransactionSerializer
import redis
import os
import logging

# Redis connection
redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=os.environ.get('REDIS_PORT', '6379'),
    db=int(os.environ.get('REDIS_DB', '0')),
    decode_responses=True
)

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_offer(request):
    """
    Starts the offer activation process for the connected user.
    """
    logger.info(f"User {request.user.id} requested to activate an offer")
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        logger.warning(f"User {request.user.id} attempted to activate offer without providing offer_id")
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Verification of offer existence
    offer = get_object_or_404(Offer, id=offer_id, is_active=True)
    logger.info(f"Found offer {offer_id} for user {request.user.id}")
    
    # User balance verification
    account, created = Account.objects.get_or_create(user=request.user)
    logger.info(f"User {request.user.id} account balance: {account.balance}, offer price: {offer.price}")
    
    if account.balance < offer.price:
        logger.warning(f"User {request.user.id} has insufficient balance for offer {offer_id}")
        return Response(
            {'error': 'Insufficient balance'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Deduction of offer cost from balance
    account.balance -= offer.price
    account.save()
    logger.info(f"Deducted {offer.price} from user {request.user.id} account. New balance: {account.balance}")
    
    # Generation of a unique transaction_id
    transaction_id = str(uuid.uuid4())
    logger.info(f"Generated transaction ID {transaction_id} for user {request.user.id} and offer {offer_id}")
    
    # Create transaction with PENDING status
    transaction = Transaction.objects.create(
        user=request.user,
        offer=offer,
        transaction_id=transaction_id,
        amount=offer.price,
        status='PENDING'
    )
    logger.info(f"Created transaction record {transaction_id} with PENDING status")
    
    # Create a pending user offer
    expiration_date = datetime.now() + timedelta(days=offer.duration_days)
    
    user_offer = UserOffer.objects.create(
        user=request.user,
        offer=offer,
        expiration_date=expiration_date,
        transaction_id=transaction_id,
        is_active=False  # Will be activated after processing
    )
    logger.info(f"Created user offer record for transaction {transaction_id}")
    
    # Store transaction data in Redis using HSET
    transaction_data = {
        'transaction_id': transaction_id,
        'user_id': str(request.user.id),
        'offer_id': str(offer.id),
        'amount': str(offer.price),
        'status': 'PENDING',
        'created_at': str(timezone.now()),
        'updated_at': str(timezone.now())
    }
    
    redis_client.hset(f"transaction:{transaction_id}", mapping=transaction_data)
    logger.info(f"Stored transaction data in Redis for transaction {transaction_id}")
    
    # Sending a task to a Celery worker via Redis for background processing
    process_activation.delay(transaction_id)
    logger.info(f"Queued activation task for transaction {transaction_id}")
    
    # Return an immediate response (202 Accepted) with the transaction_id for tracking
    logger.info(f"Returning 202 Accepted response for transaction {transaction_id}")
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
    logger.info(f"User {request.user.id} requested status for transaction {transaction_id}")
    
    # First try to get status from Redis
    transaction_data = redis_client.hgetall(f"transaction:{transaction_id}")
    
    if transaction_data:
        # Return data from Redis
        logger.info(f"Found transaction {transaction_id} in Redis")
        return Response(transaction_data, status=status.HTTP_200_OK)
    else:
        # Fallback to database if not found in Redis
        logger.info(f"Transaction {transaction_id} not found in Redis, checking database")
        transaction = get_object_or_404(
            Transaction,
            transaction_id=transaction_id,
            user=request.user
        )
        
        serializer = TransactionSerializer(transaction)
        logger.info(f"Found transaction {transaction_id} in database")
        return Response(serializer.data, status=status.HTTP_200_OK)