# Payout Engine Backend

This is the backend for the Payout Engine, built with Django, Django REST Framework, Celery, PostgreSQL, and Redis. It handles strict money integrity, row-level locking for concurrency, and API idempotency.

## Tech Stack
* Python 3.11
* Django 5.1
* Celery + Redis
* PostgreSQL 17

## Local Development
To run this backend locally without Docker:
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python seed.py
python manage.py runserver
```

You must also have a local Redis server running, and start the Celery workers:
```bash
celery -A playto worker --loglevel=info -P solo
celery -A playto beat --loglevel=info
```
