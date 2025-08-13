from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from offers.models import Offer
from account.models import Account
import random


class Command(BaseCommand):
    help = 'Seed the database with initial data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--users',
            type=int,
            default=5,
            help='Number of users to create (default: 5)'
        )
        parser.add_argument(
            '--offers',
            type=int,
            default=10,
            help='Number of offers to create (default: 10)'
        )

    def handle(self, *args, **options):
        # Create users
        self.stdout.write('Creating users...')
        users_count = options['users']
        for i in range(users_count):
            username = f'user{i+1}'
            if not User.objects.filter(username=username).exists():
                user = User.objects.create_user(
                    username=username,
                    email=f'user{i+1}@example.com',
                    password='password123'
                )
                # Create account for user with random balance
                Account.objects.create(
                    user=user,
                    balance=random.uniform(50.0, 500.0)
                )
                self.stdout.write(f'Created user: {username}')
            else:
                self.stdout.write(f'User {username} already exists')

        # Create offers
        self.stdout.write('Creating offers...')
        offers_count = options['offers']
        offer_types = [
            ('Internet 100Mbps', 'High-speed internet with 100 Mbps bandwidth', 29.99, 30),
            ('Internet 500Mbps', 'Ultra-fast internet with 500 Mbps bandwidth', 49.99, 30),
            ('Internet 1Gbps', 'Gigabit internet with 1000 Mbps bandwidth', 79.99, 30),
            ('Basic TV Package', '50+ channels including local and national networks', 19.99, 30),
            ('Premium TV Package', '150+ channels including premium channels', 39.99, 30),
            ('Sports Package', 'All sports channels including ESPN, Fox Sports, etc.', 24.99, 30),
            ('Movie Package', 'Premium movie channels including HBO, Cinemax, etc.', 19.99, 30),
            ('Music Package', 'Music channels for all genres', 9.99, 30),
            ('Family Bundle', 'Internet 100Mbps + Basic TV + Music', 44.99, 30),
            ('Premium Bundle', 'Internet 500Mbps + Premium TV + Sports + Movies', 99.99, 30),
            ('Ultimate Bundle', 'Internet 1Gbps + Premium TV + Sports + Movies + Music', 129.99, 30),
        ]

        for i in range(offers_count):
            # Cycle through offer types or create generic ones
            if i < len(offer_types):
                name, description, price, duration = offer_types[i]
            else:
                j = i % len(offer_types)
                name, description, price, duration = offer_types[j]
                name = f"{name} #{i+1-len(offer_types)}"
                price = round(price * random.uniform(0.8, 1.2), 2)

            if not Offer.objects.filter(name=name).exists():
                Offer.objects.create(
                    name=name,
                    description=description,
                    price=price,
                    duration_days=duration,
                    is_active=True
                )
                self.stdout.write(f'Created offer: {name}')
            else:
                self.stdout.write(f'Offer {name} already exists')

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded database with {users_count} users and {offers_count} offers'
            )
        )