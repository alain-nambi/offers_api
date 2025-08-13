import pytest
from django.core.management import call_command
from django.contrib.auth.models import User
from offers.models import Offer
from account.models import Account


@pytest.mark.django_db
class TestSeedCommand:
    def test_seed_command_creates_users_and_offers(self):
        # Run the seed command
        call_command('seed', '--users', 3, '--offers', 5, verbosity=0)
        
        # Check that users were created
        users = User.objects.filter(username__in=['user1', 'user2', 'user3'])
        assert users.count() == 3
        
        # Check that accounts were created for each user
        accounts = Account.objects.filter(user__in=users)
        assert accounts.count() == 3
        
        # Check that offers were created
        offers = Offer.objects.all()
        assert offers.count() == 5
        
        # Check that all offers have the required fields
        for offer in offers:
            assert offer.name is not None
            assert offer.description is not None
            assert offer.price is not None
            assert offer.duration_days is not None
            assert isinstance(offer.is_active, bool)

    def test_seed_command_does_not_duplicate_existing_data(self):
        # Run the seed command twice
        call_command('seed', '--users', 2, '--offers', 3, verbosity=0)
        initial_users_count = User.objects.count()
        initial_offers_count = Offer.objects.count()
        
        # Run again with the same parameters
        call_command('seed', '--users', 2, '--offers', 3, verbosity=0)
        
        # Counts should remain the same
        assert User.objects.count() == initial_users_count
        assert Offer.objects.count() == initial_offers_count