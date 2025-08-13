# Offers API

A robust, high-performance RESTful API for an offer bundle activation system (Internet, TV, etc.).

## Overview

This project implements a complete API for managing offer bundles with features like authentication, offer management, account balance tracking, and asynchronous offer activation. The system is built with modern technologies to ensure scalability and proper transaction management.

## Technology Stack

- **Language**: Python 3.x
- **Framework**: Django REST Framework
- **Database**: PostgreSQL
- **Caching/Queue System**: Redis with Celery
- **Authentication**: JWT (JSON Web Tokens)
- **Documentation**: Swagger/OpenAPI (drf-yasg)
- **Containerization**: Docker & Docker Compose

## Features

### Authentication and User Profile (/api/v1/auth)
- `POST /login`: User authentication with JWT token generation
- `GET /profile`: Retrieve authenticated user information
- `POST /logout`: Invalidate user token

### Offer Management (/api/v1/offers)
- `GET /`: List all available offers (cached for performance)
- `GET /{offer_id}`: Get details of a specific offer
- `GET /expiring/`: Get user's expiring offers
- `POST /renew/`: Renew an expiring offer

### Account Management (/api/v1/account)
- `GET /balance`: Get current user balance
- `GET /subscriptions`: List user's active subscriptions
- `GET /transactions/`: List all user transactions
- `GET /transactions/{transaction_id}/`: Get status of specific transaction

### Offer Activation (/api/v1/activation)
- `POST /`: Start asynchronous offer activation process
- `GET /status/{transaction_id}/`: Check activation status

## Architecture

The activation process is designed to be asynchronous to avoid blocking the client:

1. Client sends activation request to API
2. API deducts balance and creates PENDING transaction
3. API publishes task to Redis queue via Celery
4. Celery worker processes the activation with external systems
5. Worker updates database with final status (SUCCESS/FAILED)
6. System sends email/SMS notifications to user

## Additional Features

### Transaction Verification and Tracking
- Real-time transaction status checking
- Transaction history with filtering options
- Unique transaction IDs for tracking

### Offer Recovery and Management
- Automatic detection of expiring offers
- Offer renewal functionality
- Proactive notifications for expiring services

## Setup and Installation

### Using Docker (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd offers-api

# Start all services
docker-compose up --build
```

### Manual Installation

1. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Set up environment variables (see .env.example)

4. Run database migrations:
   ```bash
   python manage.py migrate
   ```

5. Start the development server:
   ```bash
   python manage.py runserver
   ```

6. In another terminal, start Celery worker:
   ```bash
   celery -A config worker --loglevel=info
   ```

## Database Seeding

To populate the database with initial data for testing:

### Using Docker:
```bash
docker-compose exec web python manage.py seed --users 5 --offers 10
```

### Manual Installation:
```bash
python manage.py seed --users 5 --offers 10
```

This command creates:
- 5 test users (user1, user2, etc.) with password "password123"
- 10 different offers including internet, TV, and bundle packages

## API Documentation

Once the server is running, visit:
- Swagger UI: http://localhost:8000/swagger/
- Redoc: http://localhost:8000/redoc/

## Testing

### Running Tests with Pytest

The project includes comprehensive tests for all endpoints using pytest:

```bash
# Run all tests
pytest

# Run tests for a specific app
pytest tests/auth/

# Run tests with coverage
pytest --cov=.

# Run tests with verbose output
pytest -v
```

### Test Structure

- `tests/auth/` - Authentication endpoint tests
- `tests/offers/` - Offer management endpoint tests
- `tests/account/` - Account management endpoint tests
- `tests/activation/` - Offer activation endpoint tests

All tests use fixtures for consistent setup and follow pytest best practices.

### Running Tests with Docker

To run tests in the Docker environment:

On Linux/Mac:
```bash
./run_tests.sh
```

On Windows:
```bash
run_tests.bat
```

Or manually:
```bash
# Start services
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Seed database
docker-compose exec web python manage.py seed --users 3 --offers 5

# Run tests
docker-compose exec web pytest -v
```

## Postman Collection

A Postman collection is provided in the file `Offers API.postman_collection.json`. Import this file into Postman to easily test all API endpoints.

The collection includes:
- Pre-configured requests for all endpoints
- Environment variables for easy configuration
- Example requests and expected parameters

## Monitoring and Observability

The system is designed to integrate with:
- ELK/Loki stack for centralized logging
- Prometheus for metrics collection
- Grafana for dashboard visualization

## Deployment

The project is containerized with Docker and Docker Compose for simple and reproducible deployment. All configurations are managed via environment variables.