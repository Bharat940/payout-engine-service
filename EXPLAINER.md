## Q1. The Ledger. Paste your balance calculation query. Why did you model credits and debits this way?

```python
def calculate_balances(merchant):
    """
    Calculates total balance and held balance for a merchant using DB aggregation.
    """
    ledger_agg = LedgerEntry.objects.filter(merchant=merchant).aggregate(
        total_credits=Sum('amount_paise', filter=Q(entry_type='credit')),
        total_debits=Sum('amount_paise', filter=Q(entry_type='debit')),
    )
    total_credits = ledger_agg['total_credits'] or 0
    total_debits = ledger_agg['total_debits'] or 0
    total_balance = total_credits - total_debits

    # Held balance = pending or processing payouts
    held_balance = Payout.objects.filter(
        merchant=merchant, 
        status__in=['pending', 'processing']
    ).aggregate(Sum('amount_paise'))['amount_paise__sum'] or 0

    return total_balance, held_balance
```

I chose the append-only ledger design because it is guaranteed that whatever the balance currently displays must be mathematically derived from the immutable transaction record. In a mutable design, a race condition or some other failure could cause the current balance not to match up with the real transaction history anymore. With the design where the balance is derived from SUM(credits) - SUM(debits), we know that the displayed balance will always be mathematically derived from the immutable transaction record.

## Q2. The Lock. Paste the exact code that prevents two concurrent payouts from overdrawing a balance. Explain what database primitive it relies on.

```python
            # Lock the merchant row to serialize balance checks
            # No other payout request for this merchant can proceed past this line until we commit
            merchant_locked = Merchant.objects.select_for_update().get(id=merchant.id)

            amount_paise = request.data.get('amount_paise')
            bank_account_id = request.data.get('bank_account_id')

            if not amount_paise or not bank_account_id:
                return Response({"error": "amount_paise and bank_account_id required"}, status=400)

            try:
                amount_paise = int(amount_paise)
            except ValueError:
                return Response({"error": "amount_paise must be an integer"}, status=400)

            # Re-calculate balance inside the lock
            available_balance, held_balance = calculate_balances(merchant_locked)

            if available_balance < amount_paise:
                return Response({"error": "Insufficient funds"}, status=status.HTTP_400_BAD_REQUEST)
```

This approach uses PostgreSQL Row-Level Locking via the `SELECT ... FOR UPDATE` SQL command.

As soon as the request hits the select_for_update() line, PostgreSQL takes out an exclusive lock on the row of that Merchant within the database. When another request comes in concurrently just a millisecond later for the same Merchant, PostgreSQL notices the lock, and the request waits.

After the lock is taken out by the initial request, which has already done the balance deduction and committed the transaction, the lock is released, and the second request proceeds. It will see the balance that has already been reduced and reject the transaction for being too low.

## Q3. The Idempotency. How does your system know it has seen a key before? What happens if the first request is in flight when the second arrives?

```python
# 1. Idempotency Check
        existing_record = IdempotencyRecord.objects.filter(
            merchant=merchant, 
            key=idempotency_key,
            expires_at__gt=timezone.now()
        ).first()

        if existing_record:
            if existing_record.payout:
                # Return the previously stored response
                return Response(existing_record.response_body, status=existing_record.status_code)
            else:
                # Key exists but no payout yet = request is currently in-flight
                return Response({
                    "error": "A request with this idempotency key is currently being processed."
                }, status=status.HTTP_409_CONFLICT)

```

The system is able to know whether a key is present by verifying the existence of an entry in the `IdempotencyRecord` table with the corresponding merchant and key.
`IdempotencyRecord` is a database table where unique requests and their responses are saved to avoid multiple processing of them.
When the key is found and payout is marked, it means the request has already been successfully processed, and a response saved in the table is returned. When the key is found and no payout flag is specified, the current status of a request is considered to be processing, and the system returns a 409 Conflict status.

## Q4. The State Machine. Where in the code is failed-to-completed blocked? Show the check.

```python
    for payout in pending_payouts:
        # Move to processing
        with transaction.atomic():
            # Lock the payout row to prevent race conditions during state change
            payout_locked = Payout.objects.select_for_update().get(id=payout.id)
            
            # STATE MACHINE GUARD: Prevent backwards transitions
            if payout_locked.status in ['completed', 'failed']:
                continue
```

In `backend/payouts/tasks.py`, the transition of status from `failed` to `completed` cannot occur. Prior to the system changing a status of a payout to `processing`, `completed`, or `failed`, it enters a database transaction block and locks the row in the specific Payout.

After acquiring the lock, the system verifies whether `payout_locked.status in ['completed', 'failed']` is True. In such a way, when it is true, the system ignores all following conditions and transitions to the next payout, preventing an unwanted transition from `failed` to `completed` because of the delayed network response or Celery's duplicated task.

## Q5. The AI Audit. One specific example where AI wrote subtly wrong code (bad locking, wrong aggregation, race condition). Paste what it gave you, what you caught, and what you replaced it with.

Although the AI had recommended computing the overall balance by adding up all the ledger entries in a Python list,
```python
entries = LedgerEntry.objects.filter(merchant=merchant)
balance = sum(e.amount for e in entries if e.type == 'credit') - sum(e.amount for e in entries if e.type == 'debit')
```
I opted for Sum at Database Level.

Justifications: The process is highly inefficient, highly memory-consuming for large ledgers, and also susceptible to race conditions due to mutations to the rows before and during computation. The utilization of Sum() guarantees that the summation will be executed deeply within the database engine (optimized at the C-level) and that the select_for_update lock will persist.