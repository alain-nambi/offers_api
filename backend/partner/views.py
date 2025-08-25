from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from offers.models import Offer
from .models import PartnerTransaction
import uuid
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def activate_offer(request):
    """
    Partner API endpoint to initiate an offer activation.
    Returns a reference number for tracking.
    """
    try:
        # Extract data from request
        user_id = request.data.get('user_id')
        offer_id = request.data.get('offer_id')
        amount = request.data.get('amount')

        # Validate that the requesting user matches the user_id in the request
        if str(request.user.id) != str(user_id):
            logger.warning(f"User {request.user.id} attempted to activate offer for user {user_id}")
            return Response(
                {'error': 'Not authorized to activate offer for this user'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate user exists
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            logger.warning(f"User {user_id} not found for activation request by user {request.user.id}")
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate offer exists and is active
        try:
            offer = Offer.objects.get(id=offer_id, is_active=True)
        except Offer.DoesNotExist:
            logger.warning(f"Offer {offer_id} not found or inactive for activation request by user {request.user.id}")
            return Response(
                {'error': 'Offer not found or inactive'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate amount matches offer price
        if str(offer.price) != str(amount):
            logger.warning(f"Amount mismatch for offer {offer_id}: expected {offer.price}, got {amount}")
            return Response(
                {'error': 'Amount does not match offer price'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not all([user_id, offer_id, amount]):
            return Response(
                {'error': 'Missing required fields: user_id, offer_id, amount'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Generate a unique reference
        reference = f"REF-{uuid.uuid4().hex[:12].upper()}"
        transaction_id = str(uuid.uuid4())

        # Create partner transaction record
        partner_transaction = PartnerTransaction.objects.create(
            transaction_id=transaction_id,
            user=user,
            offer=offer,
            amount=amount,
            reference=reference,
            status='PENDING'
        )

        logger.info(f"Created partner transaction {transaction_id} with reference {reference}")

        # Return reference for tracking
        return Response({
            'reference': reference,
            'transaction_id': transaction_id,
            'status': 'PENDING',
            'message': 'Activation request received'
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error in partner activation: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def validate_transaction(request, reference):
    """
    Partner API endpoint to validate a transaction by reference.
    """
    try:
        # Look up the transaction by reference
        partner_transaction = PartnerTransaction.objects.get(reference=reference)

        # Check if the requesting user owns this transaction
        if partner_transaction.user != request.user:
            logger.warning(f"User {request.user.id} attempted to validate transaction {reference} owned by user {partner_transaction.user.id}")
            return Response(
                {'error': 'Not authorized to validate this transaction'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Return transaction details
        return Response({
            'reference': partner_transaction.reference,
            'transaction_id': partner_transaction.transaction_id,
            'user_id': partner_transaction.user.id,
            'offer_id': partner_transaction.offer.id,
            'amount': str(partner_transaction.amount),
            'status': partner_transaction.status,
            'created_at': partner_transaction.created_at,
            'updated_at': partner_transaction.updated_at,
            'is_valid': True
        }, status=status.HTTP_200_OK)

    except PartnerTransaction.DoesNotExist:
        return Response({
            'reference': reference,
            'is_valid': False,
            'error': 'Transaction not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error validating transaction {reference}: {str(e)}")
        return Response(
            {'error': 'Internal server error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )