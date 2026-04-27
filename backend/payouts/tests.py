import uuid
import concurrent.futures
from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Merchant, BankAccount, LedgerEntry, Payout

class PayoutEngineTests(TransactionTestCase):
    def setUp(self):
        self.client = APIClient()
        self.merchant = Merchant.objects.create(name="Test Merchant", email="test@merchant.com")
        self.bank = BankAccount.objects.create(
            merchant=self.merchant,
            account_number="123456789",
            bank_name="Test Bank",
            ifsc_code="TEST0001234"
        )
        # Seed initial credit: 1000 INR (100,000 paise)
        LedgerEntry.objects.create(
            merchant=self.merchant,
            entry_type='credit',
            amount_paise=100000,
            description="Initial Credit"
        )
        self.payout_url = reverse('payouts')

    def test_payout_idempotency(self):
        """
        Verify that duplicate requests with the same key return the same response
        and create only one payout.
        """
        idempotency_key = str(uuid.uuid4())
        payload = {
            "amount_paise": 10000,
            "bank_account_id": self.bank.id
        }
        headers = {
            "HTTP_X_MERCHANT_ID": self.merchant.id,
            "HTTP_IDEMPOTENCY_KEY": idempotency_key
        }

        # First request
        response1 = self.client.post(self.payout_url, payload, **headers)
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        payout_id = response1.data['id']

        # Second request (duplicate)
        response2 = self.client.post(self.payout_url, payload, **headers)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.data['id'], payout_id)

        # Verify only one payout exists
        self.assertEqual(Payout.objects.filter(merchant=self.merchant).count(), 1)

    def test_payout_concurrency(self):
        """
        Simulate two simultaneous requests for 60% of balance each.
        Only one should succeed.
        """
        idempotency_key1 = str(uuid.uuid4())
        idempotency_key2 = str(uuid.uuid4())
        
        # Balance is 100,000 paise. We try to withdraw 60,000 twice.
        payload = {
            "amount_paise": 60000,
            "bank_account_id": self.bank.id
        }

        def make_request(key):
            # Using a fresh client for each thread
            client = APIClient()
            headers = {
                "HTTP_X_MERCHANT_ID": self.merchant.id,
                "HTTP_IDEMPOTENCY_KEY": key
            }
            return client.post(self.payout_url, payload, **headers)

        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
            # Run requests in parallel
            future1 = executor.submit(make_request, idempotency_key1)
            future2 = executor.submit(make_request, idempotency_key2)
            
            res1 = future1.result()
            res2 = future2.result()

        # One must succeed (201) and one must fail (400)
        status_codes = [res1.status_code, res2.status_code]
        self.assertIn(status.HTTP_201_CREATED, status_codes)
        self.assertIn(status.HTTP_400_BAD_REQUEST, status_codes)
        
        # Verify ledger balance: 100,000 - 60,000 = 40,000
        self.assertEqual(Payout.objects.filter(merchant=self.merchant, status='pending').count(), 1)

