from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.csrf import csrf_exempt
from .models import PartnerTransaction
import uuid
import logging

logger = logging.getLogger(__name__)


@api_view(['POST'])
@permission_classes([AllowAny])
@csrf_exempt
def activate_offer(request):
    """
    Partner API endpoint to initiate an offer activation.
    Returns a reference number for tracking.
    """
    try:
        # In a real implementation, you would validate the partner's API key
        # For this example, we'll just process the request
        
        # Extract data from request
        user_id = request.data.get('user_id')
        offer_id = request.data.get('offer_id')
        amount = request.data.get('amount')
        
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
            user_id=user_id,
            offer_id=offer_id,
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
@permission_classes([AllowAny])
def validate_transaction(request, reference):
    """
    Partner API endpoint to validate a transaction by reference.
    """
    try:
        # Look up the transaction by reference
        partner_transaction = PartnerTransaction.objects.get(reference=reference)
        
        # Return transaction details
        return Response({
            'reference': partner_transaction.reference,
            'transaction_id': partner_transaction.transaction_id,
            'user_id': partner_transaction.user_id,
            'offer_id': partner_transaction.offer_id,
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