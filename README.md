# Payout Engine

A production-ready payout engine built for the Founding Engineer Challenge. Features strict money integrity, concurrency safety, and idempotency.

## Tech Stack
* **Backend:** Django 5.1, Django REST Framework
* **Database:** PostgreSQL 17
* **Background Jobs:** Celery + Redis
* **Frontend:** React 19, Vite 6, Tailwind CSS v4
* **DevOps:** Docker Compose

## Setup and Installation

### Option 1: Docker Compose (Recommended)
The easiest way to run the entire stack:
```bash
docker-compose up --build
```
This starts the DB, Redis, API, Workers, and Frontend (at http://localhost:3000). It also automatically runs migrations and seeds the database.

### Option 2: Local Development
1. **Backend:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   python manage.py migrate
   python seed.py
   python manage.py runserver
   ```
2. **Workers:**
   ```bash
   celery -A playto worker --loglevel=info -P solo
   celery -A playto beat --loglevel=info
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## Running Tests
The project includes meaningful tests for the most critical requirements:
### Option 1: Using Docker (Recommended)
```bash
docker-compose exec api python manage.py test payouts
```

### Option 2: Local Execution
*(Requires a local PostgreSQL database to be running and configured)*
```bash
cd backend
python manage.py test payouts
```
* `test_payout_idempotency`: Validates unique request handling and stored response return.
* `test_payout_concurrency`: Simulates multi-threaded race conditions to prove balance safety.

## Architecture and Design
Refer to [EXPLAINER.md](./EXPLAINER.md) for detailed answers on:
1. **The Ledger**: Append-only model for money integrity.
2. **The Lock**: Row-level locking for concurrency protection.
3. **The Idempotency**: Stripe-standard implementation for API reliability.
4. **The State Machine**: Transition guards and atomic refunds.
