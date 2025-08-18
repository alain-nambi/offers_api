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
- Optimized for production performance

### docker-compose.prod.yml
- Separates services with proper restart policies
- Uses environment files for configuration
- Includes volume management for static files and database persistence
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