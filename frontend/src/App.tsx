import { useState, useEffect, useCallback } from 'react';
import { IndianRupee, Wallet, Clock, AlertTriangle } from 'lucide-react';
import { getBalance, getPayouts, getLedger, createPayout } from './api';
import type { BalanceResponse, Payout, LedgerEntry } from './api';
import StatCard from './components/StatCard';
import PayoutForm from './components/PayoutForm';
import PayoutTable from './components/PayoutTable';
import LedgerTable from './components/LedgerTable';

function App() {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [balanceRes, payoutsRes, ledgerRes] = await Promise.all([
        getBalance(),
        getPayouts(),
        getLedger()
      ]);
      setBalance(balanceRes.data);
      setPayouts(payoutsRes.data);
      setLedger(ledgerRes.data);
      setError(null);
    } catch (err: unknown) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Connection lost. Please check if your backend is running.');
    }
  }, []);

  useEffect(() => {
    // We use a local variable to prevent setting state on an unmounted component
    let isMounted = true;

    const loadInitialData = async () => {
      if (isMounted) {
        await fetchData();
      }
    };

    loadInitialData();
    
    const interval = setInterval(() => {
      if (isMounted) fetchData();
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [fetchData]);

  const handlePayoutSubmit = async (amountPaise: number, bankId: number) => {
    setIsLoading(true);
    const idempotencyKey = crypto.randomUUID();
    
    try {
      await createPayout(amountPaise, bankId, idempotencyKey);
      await fetchData(); 
    } catch (err: unknown) {
      // Type assertion for error response
      const errorMessage = (err as { response?: { data?: { error?: string } } }).response?.data?.error || 'Payout request failed';
      alert(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-600/20">
              <IndianRupee className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Merchant <span className="text-blue-500">Payouts</span></h1>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-widest">Dashboard Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-semibold text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
          <div className="mb-8 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
            <AlertTriangle size={20} />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            title="Available Balance" 
            amount={balance?.available_balance || 0} 
            icon={Wallet} 
            color="bg-emerald-500/10 text-emerald-500" 
          />
          <StatCard 
            title="Total Balance" 
            amount={balance?.total_balance || 0} 
            icon={IndianRupee} 
            color="bg-blue-500/10 text-blue-500" 
          />
          <StatCard 
            title="Held Balance" 
            amount={balance?.held_balance || 0} 
            icon={Clock} 
            color="bg-amber-500/10 text-amber-500" 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <PayoutTable payouts={payouts} />
            <LedgerTable entries={ledger} />
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-28">
              <PayoutForm onSubmit={handlePayoutSubmit} isLoading={isLoading} />
              
              <div className="mt-8 p-6 bg-blue-600/5 border border-blue-500/10 rounded-2xl">
                <h4 className="text-sm font-semibold text-blue-500 mb-2 uppercase tracking-wider">Quick Note</h4>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Payouts are processed by our automated engine. Success rates are simulated for this challenge (70% Success).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
