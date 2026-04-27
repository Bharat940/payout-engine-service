from django.urls import path
from .views import BalanceView, PayoutView, LedgerListView

urlpatterns = [
    path('balance/', BalanceView.as_view(), name='balance'),
    path('payouts/', PayoutView.as_view(), name='payouts'),
    path('ledger/', LedgerListView.as_view(), name='ledger'),
]
