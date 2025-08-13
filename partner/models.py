from django.db import models
from django.contrib.auth.models import User
from offers.models import Offer


class PartnerTransaction(models.Model):
    """
    Model to store partner transaction references for validation
    """
    transaction_id = models.CharField(max_length=100, unique=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, default='PENDING')
    reference = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"PartnerTransaction {self.transaction_id} - {self.reference}"