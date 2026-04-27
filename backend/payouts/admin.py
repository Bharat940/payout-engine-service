from django.contrib import admin
from .models import Merchant, BankAccount, LedgerEntry, Payout, IdempotencyRecord

@admin.register(Merchant)
class MerchantAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'email', 'created_at')
    search_fields = ('name', 'email')

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('id', 'merchant', 'bank_name', 'account_number', 'is_active')
    list_filter = ('is_active', 'bank_name')

@admin.register(LedgerEntry)
class LedgerEntryAdmin(admin.ModelAdmin):
    list_display = ('id', 'merchant', 'entry_type', 'amount_paise', 'created_at')
    list_filter = ('entry_type', 'merchant')

@admin.register(Payout)
class PayoutAdmin(admin.ModelAdmin):
    list_display = ('id', 'merchant', 'amount_paise', 'status', 'created_at')
    list_filter = ('status', 'merchant')

@admin.register(IdempotencyRecord)
class IdempotencyRecordAdmin(admin.ModelAdmin):
    list_display = ('id', 'merchant', 'key', 'status_code', 'created_at')
    list_filter = ('status_code',)
