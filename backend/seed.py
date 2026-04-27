import os
import django
import uuid
import random
from django.utils import timezone

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'playto.settings')
django.setup()

from payouts.models import Merchant, BankAccount, LedgerEntry, Payout

def seed_data():
    print("Seeding data...")

    # 1. Create Merchants
    merchants_data = [
        {"name": "Agency Alpha", "email": "alpha@agency.com"},
        {"name": "Freelancer Beta", "email": "beta@freelance.com"},
        {"name": "SaaS Gamma", "email": "gamma@saas.com"},
    ]

    for m_data in merchants_data:
        merchant, created = Merchant.objects.get_or_create(email=m_data["email"], defaults={"name": m_data["name"]})
        
        if created:
            print(f"Created merchant: {merchant.name}")
            
            # 2. Create Bank Accounts
            BankAccount.objects.create(
                merchant=merchant,
                account_number=f"ACC{random.randint(100000, 999999)}",
                bank_name="HDFC Bank",
                ifsc_code="HDFC0001234"
            )
            BankAccount.objects.create(
                merchant=merchant,
                account_number=f"ACC{random.randint(100000, 999999)}",
                bank_name="ICICI Bank",
                ifsc_code="ICIC0005678"
            )

            # 3. Create Initial Credits (Customer Payments)
            # Total ~5000 INR
            amounts = [150000, 200000, 150000] # in paise
            for amt in amounts:
                LedgerEntry.objects.create(
                    merchant=merchant,
                    entry_type='credit',
                    amount_paise=amt,
                    description="Incoming customer payment"
                )

            # 4. Create a few completed payouts
            payout_amt = 50000 # 500 INR
            bank = merchant.bank_accounts.first()
            
            payout = Payout.objects.create(
                merchant=merchant,
                bank_account=bank,
                amount_paise=payout_amt,
                status='completed',
                idempotency_key=str(uuid.uuid4())
            )
            
            LedgerEntry.objects.create(
                merchant=merchant,
                entry_type='debit',
                amount_paise=payout_amt,
                reference_id=payout.id,
                description=f"Completed payout #{payout.id}"
            )

    print("Seeding complete! You can now use these merchants for testing.")
    print("Merchant IDs:")
    for m in Merchant.objects.all():
        print(f"- {m.name}: {m.id}")

if __name__ == "__main__":
    seed_data()
