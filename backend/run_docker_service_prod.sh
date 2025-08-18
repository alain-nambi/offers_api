#!/bin/bash

# Script to run Docker environment and execute tests

echo "Starting Docker environment..."
docker compose -f docker-compose.prod.yml up --build