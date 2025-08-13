from django.db import models
from django.contrib.auth.models import User


class Offer(models.Model):
    """Model representing an offer (Internet, TV, etc.)"""
    name = models.CharField(max_length=100)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    duration_days = models.IntegerField(help_text="Duration of the offer in days")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class UserOffer(models.Model):
    """Model representing an active offer for a user"""
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    offer = models.ForeignKey(Offer, on_delete=models.CASCADE)
    activation_date = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    transaction_id = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.user.username} - {self.offer.name}"