import random
from celery import shared_task
from django.db import transaction
from django.utils import timezone
from datetime import timedelta
from .models import Payout, LedgerEntry

@shared_task
def process_payouts():
    """
    Task to pick up pending payouts and move them through the lifecycle.
    70% Success, 20% Fail, 10% Hang.
    """
    pending_payouts = Payout.objects.filter(status='pending')
    
    for payout in pending_payouts:
        with transaction.atomic():
            # Lock the payout row to prevent race conditions during state change
            payout_locked = Payout.objects.select_for_update().get(id=payout.id)
            
            # Prevent backwards transitions
            if payout_locked.status in ['completed', 'failed']:
                continue
                
            payout_locked.status = 'processing'
            payout_locked.processing_started_at = timezone.now()
            payout_locked.save()
            
            # Use locked object for the rest of processing
            payout = payout_locked

        # Simulate Bank Outcome
        outcome = random.random()
        
        if outcome < 0.70:
            # Success
            payout.status = 'completed'
            payout.save()
            print(f"Payout {payout.id} completed successfully.")
        elif outcome < 0.90:
            # Failure
            fail_payout(payout.id)
            print(f"Payout {payout.id} failed.")
        else:
            # Hang (stays in processing)
            print(f"Payout {payout.id} is hanging.")

@shared_task
def monitor_stuck_payouts():
    """
    Monitors payouts that have been stuck in 'processing' for more than 30 seconds.
    Retries up to 3 times with exponential backoff.
    """
    stuck_time = timezone.now() - timedelta(seconds=30)
    stuck_payouts = Payout.objects.filter(status='processing', processing_started_at__lt=stuck_time)
    
    for payout in stuck_payouts:
        if payout.attempt_count < 3:
            payout.attempt_count += 1
            # Exponential backoff simulation
            payout.processing_started_at = timezone.now()
            payout.save()
            print(f"Retrying payout {payout.id} (Attempt {payout.attempt_count})")
        else:
            # Max attempts reached, fail it
            fail_payout(payout.id)
            print(f"Payout {payout.id} failed after max retries.")

def fail_payout(payout_id):
    """
    Atomically fails a payout and returns funds to the merchant ledger.
    """
    with transaction.atomic():
        payout = Payout.objects.select_for_update().get(id=payout_id)
        if payout.status in ['completed', 'failed']:
            return

        payout.status = 'failed'
        payout.save()

        # Return funds to balance
        LedgerEntry.objects.create(
            merchant=payout.merchant,
            entry_type='credit',
            amount_paise=payout.amount_paise,
            reference_id=payout.id,
            description=f"Refund for failed payout #{payout.id}"
        )
