from django.urls import path
from .views import BalanceView, PayoutView, LedgerListView, ResetMerchantView

urlpatterns = [
    path('balance/', BalanceView.as_view(), name='balance'),
    path('payouts/', PayoutView.as_view(), name='payouts'),
    path('ledger/', LedgerListView.as_view(), name='ledger'),
    path('reset/', ResetMerchantView.as_view(), name='reset'),
]
