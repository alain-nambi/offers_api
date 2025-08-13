from django.shortcuts import render
from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Offer, UserOffer
from .serializers import OfferSerializer, UserOfferSerializer
from account.models import Account, Transaction
from activation.tasks import process_activation
from django.core.cache import cache
import logging
import uuid

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_offers(request):
    """
    List all available offers.
    """
    cache_key = 'offers_list'
    offers_data = cache.get(cache_key)
    
    if not offers_data:
        offers = Offer.objects.all()
        serializer = OfferSerializer(offers, many=True)
        offers_data = serializer.data
        cache.set(cache_key, offers_data, 300)  # Cache for 5 minutes
    
    return Response(offers_data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def offer_detail(request, offer_id):
    """
    Get details of a specific offer.
    """
    try:
        offer = Offer.objects.get(pk=offer_id)
        serializer = OfferSerializer(offer)
        return Response(serializer.data)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_offer(request):
    """
    Activate an offer for the authenticated user.
    """
    user = request.user
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check user's account balance
    try:
        account = Account.objects.get(user=user)
        if account.balance < offer.price:
            return Response(
                {'error': 'Insufficient balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Deduct amount from user's account
    account.balance -= offer.price
    account.save()
    
    # Create transaction record
    transaction = Transaction.objects.create(
        user=user,
        offer=offer,
        amount=offer.price,
        transaction_id=str(uuid.uuid4()),
        status='PENDING'
    )
    
    # Create user offer record
    user_offer = UserOffer.objects.create(
        user=user,
        offer=offer,
        transaction_id=transaction,  # Use the transaction_id directly from transaction object
        is_active=False,  # Will be activated by Celery task
        expiration_date=timezone.now() + timezone.timedelta(days=offer.duration_days)
    )
    
    # Process activation asynchronously
    process_activation.delay(transaction.transaction_id)
    
    return Response({
        'message': 'Offer activation in progress',
        'transaction_id': transaction.transaction_id
    }, status=status.HTTP_202_ACCEPTED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def expiring_offers(request):
    """
    Get offers that are about to expire for the authenticated user.
    """
    threshold_date = timezone.now() + timezone.timedelta(days=3)
    
    expiring_offers = UserOffer.objects.filter(
        user=request.user,
        is_active=True,
        expiration_date__lte=threshold_date,
        expiration_date__gte=timezone.now()
    ).select_related('offer')
    
    serializer = UserOfferSerializer(expiring_offers, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renew_offer(request):
    """
    Renew an expiring offer for the authenticated user.
    """
    user = request.user
    offer_id = request.data.get('offer_id')
    
    if not offer_id:
        return Response(
            {'error': 'offer_id is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        offer = Offer.objects.get(pk=offer_id)
    except Offer.DoesNotExist:
        return Response(
            {'error': 'Offer not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Check user's account balance
    try:
        account = Account.objects.get(user=user)
        if account.balance < offer.price:
            return Response(
                {'error': 'Insufficient balance'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    except Account.DoesNotExist:
        return Response(
            {'error': 'Account not found'}, 
            status=status.HTTP_404_NOT_FOUND
        )
    
    # Deduct amount from user's account
    account.balance -= offer.price
    account.save()
    
    # Create transaction record
    transaction = Transaction.objects.create(
        user=user,
        offer=offer,
        amount=offer.price,
        transaction_id=str(uuid.uuid4()),
        status='PENDING'
    )
    
    # Update or create user offer record
    user_offer, created = UserOffer.objects.update_or_create(
        user=user,
        offer=offer,
        defaults={
            'transaction_id': transaction.transaction_id,
            'is_active': False,
            'expiration_date': timezone.now() + timezone.timedelta(days=offer.duration_days)
        }
    )
    
    # Process activation asynchronously
    process_activation.delay(transaction.transaction_id)
    
    return Response({
        'message': 'Offer renewal in progress',
        'transaction_id': transaction.transaction_id
    }, status=status.HTTP_202_ACCEPTED)