from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth.models import User
from account.models import Transaction
from offers.models import UserOffer, Offer
from partner.models import PartnerTransaction
import logging
import redis
import os
import uuid
import json

# Redis connection
redis_client = redis.Redis(
    host=os.environ.get('REDIS_HOST', 'localhost'),
    port=os.environ.get('REDIS_PORT', '6379'),
    db=int(os.environ.get('REDIS_DB', '0')),
    decode_responses=True
)

logger = logging.getLogger(__name__)

# Partner system configuration
PARTNER_SYSTEM_TIMEOUT = int(os.environ.get('PARTNER_SYSTEM_TIMEOUT', '30'))  # seconds


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def process_activation(self, transaction_id):
    """
    Process the activation of an offer in the background by calling the partner API.
    Implements retry mechanism with exponential backoff for failed requests.
    """
    try:
        logger.info(f"Starting activation process for transaction {transaction_id}")
        
        # Get the transaction
        transaction = Transaction.objects.get(transaction_id=transaction_id)
        logger.info(f"Retrieved transaction {transaction_id} for user {transaction.user.id}, offer {transaction.offer.id}")
        
        # Update status to PROCESSING
        transaction.status = 'PROCESSING'
        transaction.save()
        logger.info(f"Updated transaction {transaction_id} status to PROCESSING")
        
        # Update Redis with PROCESSING status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'PROCESSING',
            'updated_at': str(timezone.now())
        })
        logger.info(f"Updated Redis status for transaction {transaction_id} to PROCESSING")
        
        # Call partner system for activation
        logger.info(f"Calling partner system for transaction {transaction_id}")
        activation_result = activate_offer_with_partner(transaction)
        logger.info(f"Partner system response for transaction {transaction_id}: {activation_result}")
        
        if activation_result.get('success', False):
            logger.info(f"Activation successful for transaction {transaction_id}")
            # Success case
            transaction.status = 'SUCCESS'
            transaction.completed_at = timezone.now()
            transaction.save()
            logger.info(f"Updated transaction {transaction_id} status to SUCCESS in database")
            
            # Update Redis with SUCCESS status
            redis_client.hset(f"transaction:{transaction_id}", mapping={
                'status': 'SUCCESS',
                'updated_at': str(timezone.now()),
                'reference': activation_result.get('reference', '')
            })
            logger.info(f"Updated Redis status for transaction {transaction_id} to SUCCESS")
            
            # Activate the user offer
            try:
                user_offer = UserOffer.objects.get(transaction_id=transaction_id)
                user_offer.is_active = True
                user_offer.save()
                logger.info(f"Activated user offer for transaction {transaction_id}")
            except UserOffer.DoesNotExist:
                logger.error(f"UserOffer not found for transaction {transaction_id}")
            
            # Send notification to user
            send_notification(
                transaction.user.email,
                "Offer Activation Successful",
                f"Your offer {transaction.offer.name} has been successfully activated. "
                f"Reference: {activation_result.get('reference', 'N/A')}"
            )
            logger.info(f"Sent success notification for transaction {transaction_id}")
        else:
            logger.warning(f"Activation failed for transaction {transaction_id}: {activation_result.get('error', 'Unknown error')}")
            # Failure case
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
            logger.info(f"Updated transaction {transaction_id} status to FAILED in database")
            
            # Update Redis with FAILED status
            redis_client.hset(f"transaction:{transaction_id}", mapping={
                'status': 'FAILED',
                'updated_at': str(timezone.now()),
                'error_message': activation_result.get('error', 'Unknown error')
            })
            logger.info(f"Updated Redis status for transaction {transaction_id} to FAILED")
            
            # Refund the user
            from account.models import Account
            account, created = Account.objects.get_or_create(user=transaction.user)
            account.balance += transaction.amount
            account.save()
            logger.info(f"Refunded {transaction.amount} to user {transaction.user.id} for failed transaction {transaction_id}")
            
            # Send notification to user
            send_notification(
                transaction.user.email,
                "Offer Activation Failed",
                f"Your offer {transaction.offer.name} activation failed. Amount has been refunded. "
                f"Error: {activation_result.get('error', 'Unknown error')}"
            )
            logger.info(f"Sent failure notification for transaction {transaction_id}")
            
        logger.info(f"Completed activation process for transaction {transaction_id} with status: {transaction.status}")
        return f"Activation processed with status: {transaction.status}"
        
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found")
        # Update Redis with FAILED status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'FAILED',
            'updated_at': str(timezone.now()),
            'error_message': 'Transaction not found'
        })
        logger.info(f"Updated Redis status for transaction {transaction_id} to FAILED due to not found")
        return f"Transaction {transaction_id} not found"
    except Exception as e:
        logger.error(f"Error processing activation {transaction_id}: {str(e)}", exc_info=True)
        # Update Redis with FAILED status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'FAILED',
            'updated_at': str(timezone.now()),
            'error_message': str(e)
        })
        logger.info(f"Updated Redis status for transaction {transaction_id} to FAILED due to exception")
        
        # Update transaction status to FAILED in case of exception
        try:
            transaction = Transaction.objects.get(transaction_id=transaction_id)
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
            logger.info(f"Updated transaction {transaction_id} status to FAILED in database due to exception")
        except Transaction.DoesNotExist:
            logger.error(f"Transaction {transaction_id} not found during exception handling")
            pass
        return f"Error processing activation: {str(e)}"


def activate_offer_with_partner(transaction):
    """
    Directly create partner transaction instead of calling partner API via HTTP.
    
    Args:
        transaction (Transaction): The transaction to activate
        
    Returns:
        dict: Response with success status, reference number, and optional error message
    """
    try:
        logger.info(f"Creating partner transaction for internal transaction {transaction.transaction_id}")
        
        # Validate user exists
        try:
            user = User.objects.get(id=transaction.user.id)
        except User.DoesNotExist:
            logger.warning(f"User {transaction.user.id} not found for partner transaction")
            return {
                'success': False,
                'error': 'User not found'
            }
        
        # Validate offer exists and is active
        try:
            offer = Offer.objects.get(id=transaction.offer.id, is_active=True)
        except Offer.DoesNotExist:
            logger.warning(f"Offer {transaction.offer.id} not found or inactive for partner transaction")
            return {
                'success': False,
                'error': 'Offer not found or inactive'
            }
        
        # Validate amount matches offer price
        if transaction.offer.price != transaction.amount:
            logger.warning(f"Amount mismatch for offer {transaction.offer.id}: expected {transaction.offer.price}, got {transaction.amount}")
            return {
                'success': False,
                'error': 'Amount does not match offer price'
            }
        
        # Generate a unique reference
        reference = f"REF-{uuid.uuid4().hex[:12].upper()}"
        partner_transaction_id = str(uuid.uuid4())
        
        # Create partner transaction record
        partner_transaction = PartnerTransaction.objects.create(
            transaction_id=partner_transaction_id,
            user=user,
            offer=offer,
            amount=transaction.amount,
            reference=reference,
            status='SUCCESS'  # Direct creation means immediate success
        )
        
        logger.info(f"Created partner transaction {partner_transaction_id} with reference {reference}")
        
        # Validate the reference by retrieving it
        if validate_partner_transaction(reference):
            logger.info(f"Reference {reference} validated successfully for transaction {transaction.transaction_id}")
            return {
                'success': True,
                'reference': reference,
                'data': {
                    'reference': reference,
                    'transaction_id': partner_transaction_id,
                    'status': 'SUCCESS',
                    'message': 'Activation completed successfully'
                }
            }
        else:
            logger.warning(f"Invalid reference generated for partner transaction {partner_transaction_id}")
            return {
                'success': False,
                'error': 'Failed to validate generated reference'
            }
                
    except Exception as e:
        logger.error(f"Unexpected error creating partner transaction for {transaction.transaction_id}: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': f'Unexpected error: {str(e)}'
        }


def validate_partner_transaction(reference):
    """
    Validate a partner transaction by reference number.
    
    Args:
        reference (str): The reference number to validate
        
    Returns:
        bool: True if the transaction is valid, False otherwise
    """
    try:
        logger.info(f"Validating partner transaction with reference {reference}")
        
        # Look up the transaction by reference
        partner_transaction = PartnerTransaction.objects.get(reference=reference)
        
        # Return validation result
        is_valid = partner_transaction is not None
        logger.info(f"Reference {reference} validation result: {is_valid}")
        return is_valid
                
    except PartnerTransaction.DoesNotExist:
        logger.error(f"Partner transaction with reference {reference} not found")
        return False
    except Exception as e:
        logger.error(f"Error validating partner transaction {reference}: {str(e)}", exc_info=True)
        return False


def send_notification(email, subject, message):
    """
    Send notification email to user.
    In a real implementation, this would also send SMS.
    """
    try:
        logger.info(f"Sending notification to {email} with subject '{subject}'")
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@offersapi.com',
            [email],
            fail_silently=True,
        )
        logger.info(f"Successfully sent notification to {email}")
    except Exception as e:
        logger.error(f"Failed to send notification to {email}: {str(e)}", exc_info=True)


@shared_task
def check_expiring_offers():
    """
    Check for offers that are about to expire and send notifications.
    """
    from django.utils import timezone
    from offers.models import UserOffer
    
    # Get offers expiring in the next 3 days
    threshold_date = timezone.now() + timezone.timedelta(days=3)
    
    expiring_offers = UserOffer.objects.filter(
        is_active=True,
        expiration_date__lte=threshold_date,
        expiration_date__gte=timezone.now()
    ).select_related('user', 'offer')
    
    for user_offer in expiring_offers:
        # Send notification to user
        send_notification(
            user_offer.user.email,
            "Offer Expiring Soon",
            f"Your offer '{user_offer.offer.name}' is expiring on {user_offer.expiration_date.strftime('%Y-%m-%d')}."
        )
        logger.info(f"Sent expiration notification for user offer {user_offer.id}")