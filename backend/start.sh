#!/bin/bash

# Exit on error for migrations and seeding
set -e

echo "Running migrations..."
python manage.py migrate

echo "Running seed script..."
python seed.py

echo "Starting Celery worker with beat..."
celery -A playto worker -B --loglevel=info &

echo "Starting Django development server..."
python manage.py runserver 0.0.0.0:$PORT
