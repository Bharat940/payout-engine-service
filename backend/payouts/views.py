from django.db import transaction
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.generics import ListAPIView
from django.shortcuts import get_object_or_404
from datetime import timedelta

from .models import Merchant, Payout, LedgerEntry, IdempotencyRecord, BankAccount
from .serializers import PayoutSerializer, LedgerEntrySerializer

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

class BalanceView(APIView):
    def get(self, request):
        # For simplicity , we'll use a merchant_id from headers
        merchant_id = request.headers.get('X-Merchant-ID')
        if not merchant_id:
            return Response({"error": "X-Merchant-ID header required"}, status=400)
        
        merchant = get_object_or_404(Merchant, id=merchant_id)
        total_balance, held_balance = calculate_balances(merchant)
        
        return Response({
            "total_balance": total_balance + held_balance,
            "held_balance": held_balance,
            "available_balance": total_balance
        })

class PayoutView(APIView):
    def get(self, request):
        merchant_id = request.headers.get('X-Merchant-ID')
        if not merchant_id:
            return Response({"error": "X-Merchant-ID header required"}, status=400)
        
        merchant = get_object_or_404(Merchant, id=merchant_id)
        payouts = Payout.objects.filter(merchant=merchant).order_by("-created_at")
        serializer = PayoutSerializer(payouts, many=True)
        return Response(serializer.data)

    def post(self, request):
        merchant_id = request.headers.get('X-Merchant-ID')
        idempotency_key = request.headers.get('Idempotency-Key')

        if not merchant_id or not idempotency_key:
            return Response({"error": "X-Merchant-ID and Idempotency-Key headers required"}, status=400)

        merchant = get_object_or_404(Merchant, id=merchant_id)

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

        # 2. Atomic Transaction with Lock
        with transaction.atomic():
            # Create the record immediately to mark it "in-flight"
            try:
                IdempotencyRecord.objects.create(
                    merchant=merchant,
                    key=idempotency_key,
                    response_body={},
                    status_code=201,
                    expires_at=timezone.now() + timedelta(hours=24)
                )
            except:
                # Handle unique constraint race condition
                return Response({
                    "error": "Request already in progress"
                }, status=status.HTTP_409_CONFLICT)

            # Lock the merchant row to serialize balance checks
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

            bank_account = get_object_or_404(BankAccount, id=bank_account_id, merchant=merchant_locked)

            # Create Payout
            payout = Payout.objects.create(
                merchant=merchant_locked,
                bank_account=bank_account,
                amount_paise=amount_paise,
                status='pending',
                idempotency_key=idempotency_key
            )

            # Create Debit Ledger Entry (Holds the funds)
            LedgerEntry.objects.create(
                merchant=merchant_locked,
                entry_type='debit',
                amount_paise=amount_paise,
                reference_id=payout.id,
                description=f"Payout request #{payout.id}"
            )

            # Update Idempotency Record with the final response
            final_data = PayoutSerializer(payout).data
            IdempotencyRecord.objects.filter(merchant=merchant, key=idempotency_key).update(
                response_body=final_data,
                status_code=201,
                payout=payout
            )

            return Response(final_data, status=status.HTTP_201_CREATED)

class LedgerListView(ListAPIView):
    serializer_class = LedgerEntrySerializer

    def get_queryset(self):
        merchant_id = self.request.headers.get('X-Merchant-ID')
        return LedgerEntry.objects.filter(merchant_id=merchant_id).order_by('-created_at')

