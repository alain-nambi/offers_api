#!/bin/bash

# 🚀 Script to run Docker environment and execute tests

echo "🐳 Starting Docker environment..."
docker compose -f docker-compose.prod.yml up --build -d

echo "✅ Docker environment started!"

echo "🌱 Running seed to populate the database..."
docker compose -f docker-compose.prod.yml exec web python manage.py seed

echo "🎉 Done!"
