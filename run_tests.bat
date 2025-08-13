@echo off
REM Script to run Docker environment and execute tests on Windows

echo Starting Docker environment...
docker-compose up -d

REM Wait for services to be ready
echo Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Run migrations
echo Running migrations...
docker-compose exec web python manage.py migrate

REM Seed the database
echo Seeding the database...
docker-compose exec web python manage.py seed --users 3 --offers 5

REM Run tests
echo Running tests...
docker-compose exec web pytest -v

echo Test execution completed!