#!/bin/bash

# Script to run Docker environment and execute tests

echo "Starting Docker environment..."
docker-compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 10

# Run migrations
echo "Running migrations..."
docker-compose exec web python manage.py migrate

# Seed the database
echo "Seeding the database..."
docker-compose exec web python manage.py seed --users 3 --offers 5

# Run tests
echo "Running tests..."
docker-compose exec web pytest -v

echo "Test execution completed!"