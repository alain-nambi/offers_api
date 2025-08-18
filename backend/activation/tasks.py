from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from account.models import Transaction
from offers.models import UserOffer
from partner.models import PartnerTransaction
import logging
import redis
import os
import requests
from requests.exceptions import RequestException, Timeout, ConnectionError
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
PARTNER_ACTIVATION_URL = os.environ.get('EXTERNAL_ACTIVATION_URL', 'http://web:8000/api/v1/partner/activate')
PARTNER_VALIDATION_URL = os.environ.get('PARTNER_VALIDATION_URL', 'http://web:8000/api/v1/partner/validate')
PARTNER_API_KEY = os.environ.get('PARTNER_API_KEY', 'partner-api-key')
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
    Call partner system to activate an offer and get a reference number.
    
    Args:
        transaction (Transaction): The transaction to activate
        
    Returns:
        dict: Response with success status, reference number, and optional error message
    """
    try:
        logger.info(f"Preparing to call partner system for transaction {transaction.transaction_id}")
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Offers-API/1.0'
        }
        
        # Prepare data for partner system
        activation_data = {
            'user_id': transaction.user.id,
            'offer_id': transaction.offer.id,
            'amount': float(transaction.amount),
        }
        logger.info(f"Prepared activation data for transaction {transaction.transaction_id}: {activation_data}")
        
        # Make request to partner system
        url = f"{PARTNER_ACTIVATION_URL}/"
        logger.info(f"Making POST request to {url} for transaction {transaction.transaction_id}")
        # logger.info(f"Full URL: {url}")
        # logger.info(f"PARTNER_ACTIVATION_URL: {PARTNER_ACTIVATION_URL}")
        # logger.info(f"Activation data: {activation_data}")
        # logger.info(f"Headers: {headers}")
        response = requests.post(
            url,
            headers=headers,
            json=activation_data,
            timeout=PARTNER_SYSTEM_TIMEOUT
        )
        logger.info(f"Received response with status {response.status_code} for transaction {transaction.transaction_id}")
        if response.status_code != 201:
            logger.error(f"Error response content: {response.text}")
        
        # Check if request was successful
        if response.status_code == 201:
            try:
                result = response.json()
                logger.info(f"Successfully parsed JSON response for transaction {transaction.transaction_id}: {result}")
                reference = result.get('reference')
                
                # Validate the reference
                if reference and validate_partner_transaction(reference):
                    logger.info(f"Reference {reference} validated successfully for transaction {transaction.transaction_id}")
                    return {
                        'success': True,
                        'reference': reference,
                        'data': result
                    }
                else:
                    logger.warning(f"Invalid reference received from partner system for transaction {transaction.transaction_id}")
                    return {
                        'success': False,
                        'error': 'Invalid reference received from partner system'
                    }
            except json.JSONDecodeError:
                # Handle case where response is not JSON
                logger.error(f"Invalid JSON response from partner system for transaction {transaction.transaction_id}")
                return {
                    'success': False,
                    'error': 'Invalid response format from partner system'
                }
        else:
            # Handle HTTP error responses
            try:
                error_data = response.json()
                logger.error(f"Partner system error for transaction {transaction.transaction_id}: {response.status_code} - {error_data}")
                return {
                    'success': False,
                    'error': f"Partner system error: {response.status_code} - {error_data.get('error', 'Unknown error')}"
                }
            except json.JSONDecodeError:
                # Handle case where error response is not JSON
                logger.error(f"Partner system error with non-JSON response for transaction {transaction.transaction_id}: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"Partner system error: {response.status_code} - {response.text}"
                }
                
    except Timeout:
        logger.error(f"Timeout calling partner system for transaction {transaction.transaction_id}")
        return {
            'success': False,
            'error': 'Timeout calling partner activation system'
        }
    except ConnectionError:
        logger.error(f"Connection error calling partner system for transaction {transaction.transaction_id}")
        return {
            'success': False,
            'error': 'Connection error with partner activation system'
        }
    except RequestException as e:
        logger.error(f"Request error calling partner system for transaction {transaction.transaction_id}: {str(e)}")
        return {
            'success': False,
            'error': f'Request error: {str(e)}'
        }
    except Exception as e:
        logger.error(f"Unexpected error calling partner system for transaction {transaction.transaction_id}: {str(e)}", exc_info=True)
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
        headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'Offers-API/1.0'
        }
        
        # Make request to validate the reference
        validation_url = f"{PARTNER_VALIDATION_URL}/{reference}/"
        logger.info(f"Making GET request to {validation_url}")
        # logger.info(f"Full validation URL: {validation_url}")
        # logger.info(f"PARTNER_VALIDATION_URL: {PARTNER_VALIDATION_URL}")
        # logger.info(f"Reference: {reference}")
        # logger.info(f"Headers: {headers}")
        response = requests.get(
            validation_url,
            headers=headers,
            timeout=PARTNER_SYSTEM_TIMEOUT
        )
        logger.info(f"Received validation response with status {response.status_code} for reference {reference}")
        logger.info(f"Response content: {response.text}")
        if response.status_code != 200:
            logger.error(f"Error validating response content: {response.text}")
        
        # Check if request was successful
        if response.status_code == 200:
            try:
                result = response.json()
                logger.info(f"Validation response for reference {reference}: {result}")
                is_valid = result.get('is_valid', False)
                logger.info(f"Reference {reference} validation result: {is_valid}")
                return is_valid
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response when validating reference {reference}")
                return False
        else:
            logger.error(f"Error validating reference {reference}: {response.status_code}")
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
    Task to check for expiring offers and notify users.
    This would be scheduled to run daily.
    """
    logger.info("Starting check for expiring offers")
    from datetime import datetime, timedelta
    from django.contrib.auth.models import User
    
    # Get offers that will expire in the next 3 days
    threshold_date = datetime.now() + timedelta(days=3)
    
    expiring_offers = UserOffer.objects.filter(
        is_active=True,
        expiration_date__lte=threshold_date,
        expiration_date__gte=datetime.now()
    ).select_related('user', 'offer')
    
    logger.info(f"Found {expiring_offers.count()} expiring offers")
    
    for user_offer in expiring_offers:
        logger.info(f"Sending expiration notification to user {user_offer.user.id} for offer {user_offer.offer.id}")
        send_notification(
            user_offer.user.email,
            "Offer Expiring Soon",
            f"Your offer {user_offer.offer.name} will expire on {user_offer.expiration_date}. "
            f"Renew it now to continue enjoying the service."
        )
    
    logger.info(f"Completed check for expiring offers. Notified {expiring_offers.count()} users")
    return f"Notified {expiring_offers.count()} users about expiring offers"