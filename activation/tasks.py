from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from account.models import Transaction
from offers.models import UserOffer
import logging
import random

logger = logging.getLogger(__name__)


@shared_task
def process_activation(transaction_id):
    """
    Process the activation of an offer in the background.
    """
    try:
        # Get the transaction
        transaction = Transaction.objects.get(transaction_id=transaction_id)
        
        # Update status to PROCESSING
        transaction.status = 'PROCESSING'
        transaction.save()
        
        # Simulate external system call for activation
        activation_result = activate_offer_in_external_system(transaction)
        
        if activation_result:
            # Success case
            transaction.status = 'SUCCESS'
            transaction.completed_at = timezone.now()
            transaction.save()
            
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
                f"Your offer {transaction.offer.name} has been successfully activated."
            )
        else:
            # Failure case
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
            
            # Refund the user
            from account.models import Account
            account, created = Account.objects.get_or_create(user=transaction.user)
            account.balance += transaction.amount
            account.save()
            
            # Send notification to user
            send_notification(
                transaction.user.email,
                "Offer Activation Failed",
                f"Your offer {transaction.offer.name} activation failed. Amount has been refunded."
            )
            
        return f"Activation processed with status: {transaction.status}"
        
    except Transaction.DoesNotExist:
        logger.error(f"Transaction {transaction_id} not found")
        return f"Transaction {transaction_id} not found"
    except Exception as e:
        logger.error(f"Error processing activation {transaction_id}: {str(e)}")
        # Update transaction status to FAILED in case of exception
        try:
            transaction = Transaction.objects.get(transaction_id=transaction_id)
            transaction.status = 'FAILED'
            transaction.completed_at = timezone.now()
            transaction.save()
        except Transaction.DoesNotExist:
            pass
        return f"Error processing activation: {str(e)}"


def activate_offer_in_external_system(transaction):
    """
    Simulate activation in an external system.
    In a real implementation, this would make API calls to external services.
    """
    # Simulate random success/failure for demo purposes
    # In a real implementation, this would call external APIs
    return random.choice([True, True, True, False])  # 75% success rate for demo


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