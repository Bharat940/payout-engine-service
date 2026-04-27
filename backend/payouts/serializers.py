from rest_framework import serializers
from .models import Merchant, BankAccount, Payout, LedgerEntry

class MerchantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Merchant
        fields = ['id', 'name', 'email', 'created_at']

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = ['id', 'account_number', 'bank_name', 'ifsc_code', 'is_active']

class PayoutSerializer(serializers.ModelSerializer):
    bank_account_details = BankAccountSerializer(source='bank_account', read_only=True)
    
    class Meta:
        model = Payout
        fields = [
            'id', 'amount_paise', 'status', 'idempotency_key', 
            'bank_account', 'bank_account_details', 
            'attempt_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'status', 'attempt_count', 'created_at', 'updated_at']

class LedgerEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = LedgerEntry
        fields = ['id', 'entry_type', 'amount_paise', 'reference_id', 'description', 'created_at']
