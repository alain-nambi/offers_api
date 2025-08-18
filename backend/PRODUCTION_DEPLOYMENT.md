# Production Deployment Guide

This guide explains how to deploy the Offers API application in a production environment using Docker and docker-compose.

## Files Created

1. `Dockerfile.prod` - Production-ready Dockerfile
2. `docker-compose.prod.yml` - Production docker-compose configuration
3. `.env.prod.example` - Example environment variables for production

## Key Differences from Development

### Dockerfile.prod
- Uses Gunicorn instead of Django's development server
- Collects static files
- Runs as a non-root user for security
- Includes netcat utility for health checks
- Creates logs directory for application logging
- Optimized for production performance

### docker-compose.prod.yml
- Separates services with proper restart policies
- Uses environment files for configuration
- Includes volume management for static files and database persistence
- Implements health checks for PostgreSQL and Redis
- Services wait for dependencies to be ready before starting
- Includes log volume for persistent logging
- Configured for production deployment

## Deployment Steps

1. Copy the example environment file:
   ```bash
   cp .env.prod.example .env.prod
   ```

2. Update the `.env.prod` file with your production values:
   ```bash
   nano .env.prod  # or your preferred editor
   ```
   
   Make sure to:
   - Set `DEBUG=False`
   - Use a strong `SECRET_KEY`
   - Set appropriate `ALLOWED_HOSTS`
   - Update database credentials
   - Set external system values

3. Build and start the services:
   ```bash
   docker-compose -f docker-compose.prod.yml up -d --build
   ```

4. Run initial migrations and create a superuser:
   ```bash
   docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
   docker-compose -f docker-compose.prod.yml exec web python manage.py createsuperuser
   ```

5. Collect static files (if needed):
   ```bash
   docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
   ```

## Health Checks and Service Dependencies

The production setup includes health checks for critical services:

1. PostgreSQL health check validates database readiness
2. Redis health check ensures cache service availability
3. Application services wait for dependencies before starting
4. Automatic restart policies ensure service recovery

## Logging

The application includes comprehensive logging for tracking activation status and other important events:

1. Django application logs are stored in `logs/django.log`
2. Activation process logs are stored in `logs/activation.log`
3. Celery task logs are stored in `logs/celery.log`
4. Log files are persisted using bind mounts, making them accessible on the host system
5. Different loggers are configured for different components

To view logs:
```bash
# View all logs
docker-compose -f docker-compose.prod.yml logs -f

# View web service logs
docker-compose -f docker-compose.prod.yml logs -f web

# View Celery worker logs
docker-compose -f docker-compose.prod.yml logs -f celery

# View specific log files directly from the host system
cat logs/django.log
cat logs/activation.log
cat logs/celery.log

# Or view log files from within the container
docker-compose -f docker-compose.prod.yml exec web cat logs/django.log
docker-compose -f docker-compose.prod.yml exec web cat logs/activation.log
docker-compose -f docker-compose.prod.yml exec web cat logs/celery.log
```

## Monitoring Activation Status

You can monitor activation status through:

1. Log files - Detailed logging of each step in the activation process
2. Redis cache - Real-time status updates stored with HSET
3. Database records - Persistent transaction records
4. API endpoints - `/api/v1/activation/status/{transaction_id}/` to check status

## Log File Access

Log files are accessible in two ways:
1. Directly on the host system in the `logs` directory
2. From within the Docker containers in the `/app/logs` directory

The bind mount configuration ensures that log files are synchronized between the container and host system, making it easy to monitor and analyze logs without needing to enter the containers.

## Security Considerations

1. Never commit your `.env.prod` file to version control
2. Use strong, unique passwords for all services
3. Generate a new SECRET_KEY for production
4. Set appropriate ALLOWED_HOSTS
5. Use HTTPS in production with a reverse proxy like Nginx or Traefik

## Maintenance

To view logs:
```bash
docker-compose -f docker-compose.prod.yml logs -f
```

To scale services:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale celery=3
```

To stop services:
```bash
docker-compose -f docker-compose.prod.yml down
```