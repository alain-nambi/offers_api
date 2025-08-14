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
PARTNER_ACTIVATION_URL = os.environ.get('EXTERNAL_ACTIVATION_URL', 'http://web:8000/api/v1/partner/activate/')
PARTNER_VALIDATION_URL = os.environ.get('PARTNER_VALIDATION_URL', 'http://web:8000/api/v1/partner/validate/')
PARTNER_API_KEY = os.environ.get('PARTNER_API_KEY', 'partner-api-key')
PARTNER_SYSTEM_TIMEOUT = int(os.environ.get('PARTNER_SYSTEM_TIMEOUT', '30'))  # seconds


@shared_task(bind=True, autoretry_for=(Exception,), retry_kwargs={'max_retries': 3})
def process_activation(self, transaction_id):
    """
    Process the activation of an offer in the background by calling the partner API.
    Implements retry mechanism with exponential backoff for failed requests.
    """
    try:
        # Get the transaction
        transaction = Transaction.objects.get(transaction_id=transaction_id)
        
        # Update status to PROCESSING
        transaction.status = 'PROCESSING'
        transaction.save()
        
        # Update Redis with PROCESSING status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'PROCESSING',
            'updated_at': str(timezone.now())
        })
        
        # Call partner system for activation
        activation_result = activate_offer_with_partner(transaction)
        
        if activation_result.get('success', False):
            # Success case
            transaction.status = 'SUCCESS'
            transaction.completed_at = timezone.now()
            transaction.save()
            
            # Update Redis with SUCCESS status
            redis_client.hset(f"transaction:{transaction_id}", mapping={
                'status': 'SUCCESS',
                'updated_at': str(timezone.now()),
                'reference': activation_result.get('reference', '')
            })
            
            # Activate the user offer
            try:
                user_offer = UserOffer.objects.get(transaction_id=transaction_id)
                user_offer.is_active = True
                user_offer.save()
            except UserOffer.DoesNotExist:
                logger.error(f"UserOffer not found for transaction {transaction_id}")
            
            # Send notification to user
            send_notification(
                transaction.user.email,
                "Offer Activation Successful",
                f"Your offer {transaction.offer.name} has been successfully activated. "
                f"Reference: {activation_result.get('reference', 'N/A')}"
            )
        else:
            # Failure case
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
            
            # Update Redis with FAILED status
            redis_client.hset(f"transaction:{transaction_id}", mapping={
                'status': 'FAILED',
                'updated_at': str(timezone.now()),
                'error_message': activation_result.get('error', 'Unknown error')
            })
            
            # Refund the user
            from account.models import Account
            account, created = Account.objects.get_or_create(user=transaction.user)
            account.balance += transaction.amount
            account.save()
            
            # Send notification to user
            send_notification(
                transaction.user.email,
                "Offer Activation Failed",
                f"Your offer {transaction.offer.name} activation failed. Amount has been refunded. "
                f"Error: {activation_result.get('error', 'Unknown error')}"
            )
            
        return f"Activation processed with status: {transaction.status}"
        
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found")
        # Update Redis with FAILED status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'FAILED',
            'updated_at': str(timezone.now()),
            'error_message': 'Transaction not found'
        })
        return f"Transaction {transaction_id} not found"
    except Exception as e:
        logger.error(f"Error processing activation {transaction_id}: {str(e)}")
        # Update Redis with FAILED status
        redis_client.hset(f"transaction:{transaction_id}", mapping={
            'status': 'FAILED',
            'updated_at': str(timezone.now()),
            'error_message': str(e)
        })
        
        # Update transaction status to FAILED in case of exception
        try:
            transaction = Transaction.objects.get(transaction_id=transaction_id)
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
        except Transaction.DoesNotExist:
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
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {PARTNER_API_KEY}',
            'User-Agent': 'Offers-API/1.0'
        }
        
        # Prepare data for partner system
        activation_data = {
            'user_id': transaction.user.id,
            'offer_id': transaction.offer.id,
            'amount': float(transaction.amount),
        }
        
        # Make request to partner system
        response = requests.post(
            PARTNER_ACTIVATION_URL,
            headers=headers,
            json=activation_data,
            timeout=PARTNER_SYSTEM_TIMEOUT
        )
        
        # Check if request was successful
        if response.status_code == 201:
            try:
                result = response.json()
                reference = result.get('reference')
                
                # Validate the reference
                if reference and validate_partner_transaction(reference):
                    return {
                        'success': True,
                        'reference': reference,
                        'data': result
                    }
                else:
                    return {
                        'success': False,
                        'error': 'Invalid reference received from partner system'
                    }
            except json.JSONDecodeError:
                # Handle case where response is not JSON
                return {
                    'success': False,
                    'error': 'Invalid response format from partner system'
                }
        else:
            # Handle HTTP error responses
            try:
                error_data = response.json()
                return {
                    'success': False,
                    'error': f"Partner system error: {response.status_code} - {error_data.get('error', 'Unknown error')}"
                }
            except json.JSONDecodeError:
                # Handle case where error response is not JSON
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
        logger.error(f"Unexpected error calling partner system for transaction {transaction.transaction_id}: {str(e)}")
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
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {PARTNER_API_KEY}',
            'User-Agent': 'Offers-API/1.0'
        }
        
        # Make request to validate the reference
        response = requests.get(
            f"{PARTNER_VALIDATION_URL}{reference}/",
            headers=headers,
            timeout=PARTNER_SYSTEM_TIMEOUT
        )
        
        # Check if request was successful
        if response.status_code == 200:
            try:
                result = response.json()
                return result.get('is_valid', False)
            except json.JSONDecodeError:
                logger.error(f"Invalid JSON response when validating reference {reference}")
                return False
        else:
            logger.error(f"Error validating reference {reference}: {response.status_code}")
            return False
                
    except Exception as e:
        logger.error(f"Error validating partner transaction {reference}: {str(e)}")
        return False


def send_notification(email, subject, message):
    """
    Send notification email to user.
    In a real implementation, this would also send SMS.
    """
    try:
        send_mail(
            subject,
            message,
            settings.DEFAULT_FROM_EMAIL or 'noreply@offersapi.com',
            [email],
            fail_silently=True,
        )
    except Exception as e:
        logger.error(f"Failed to send notification to {email}: {str(e)}")


@shared_task
def check_expiring_offers():
    """
    Task to check for expiring offers and notify users.
    This would be scheduled to run daily.
    """
    from datetime import datetime, timedelta
    from django.contrib.auth.models import User
    
    # Get offers that will expire in the next 3 days
    threshold_date = datetime.now() + timedelta(days=3)
    
    expiring_offers = UserOffer.objects.filter(
        is_active=True,
        expiration_date__lte=threshold_date,
        expiration_date__gte=datetime.now()
    ).select_related('user', 'offer')
    
    for user_offer in expiring_offers:
        send_notification(
            user_offer.user.email,
            "Offer Expiring Soon",
            f"Your offer {user_offer.offer.name} will expire on {user_offer.expiration_date}. "
            f"Renew it now to continue enjoying the service."
        )
    
    return f"Notified {expiring_offers.count()} users about expiring offers"