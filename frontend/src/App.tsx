import { useState, useEffect, useCallback } from 'react';
import { 
  IndianRupee, 
  Wallet, 
  Clock, 
  History, 
  ArrowRightLeft, 
  AlertTriangle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { getBalance, getLedger, getPayouts, resetData, createPayout, type BalanceResponse, type LedgerEntry, type Payout } from './api';
import PayoutForm from './components/PayoutForm';
import StatCard from './components/StatCard';
import PayoutTable from './components/PayoutTable';
import LedgerTable from './components/LedgerTable';

const App = () => {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isConfirmingReset, setIsConfirmingReset] = useState(false);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const [resB, resL, resP] = await Promise.all([getBalance(), getLedger(), getPayouts()]);
      setBalance(resB.data);
      setLedger(resL.data);
      setPayouts(resP.data);
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handlePayoutSubmit = async (amountPaise: number, bankId: number) => {
    if (amountPaise <= 0) {
      showToast('Payout amount must be positive', 'error');
      return;
    }

    setIsLoading(true);
    const idempotencyKey = crypto.randomUUID();

    try {
      await createPayout(amountPaise, bankId, idempotencyKey);
      showToast('Payout request submitted successfully!', 'success');
      fetchData();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Failed to submit payout. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!isConfirmingReset) {
      setIsConfirmingReset(true);
      setTimeout(() => setIsConfirmingReset(false), 3000);
      return;
    }

    try {
      await resetData();
      showToast('Data reset successfully!', 'success');
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      console.error("Reset failed", err);
      showToast('Reset failed. Please try again.', 'error');
    } finally {
      setIsConfirmingReset(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-blue-500/30 pb-20">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl border-0 ${toast.type === 'error'
            ? 'bg-rose-500/10 text-rose-400 shadow-rose-500/10'
            : 'bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10'
            } flex items-center gap-3`}>
            {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
            <span className="text-sm font-semibold">{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-slate-950/80 backdrop-blur-xl sticky top-0 z-10 border-b border-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-default">
            <div className="bg-blue-600 p-2.5 rounded-2xl shadow-xl shadow-blue-600/20">
              <IndianRupee className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Merchant <span className="text-blue-500 uppercase">Payouts</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={handleReset}
              className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 cursor-pointer ${isConfirmingReset
                  ? 'text-rose-500 scale-105'
                  : 'text-slate-500 hover:text-slate-300'
                }`}
            >
              {isConfirmingReset ? 'Click again to confirm' : 'Reset Data'}
            </button>
            <div className="hidden sm:flex px-4 py-2 bg-slate-900/50 rounded-full items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 lg:mt-12">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Main Content: History and Ledger */}
          <div className="lg:col-span-8 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6 px-2">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-3">
                  <History size={16} />
                  Payout History
                </h3>
                {isLoading && <RefreshCw size={14} className="text-blue-500 animate-spin" />}
              </div>
              <PayoutTable payouts={payouts} />
            </section>

            <section>
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-3 px-2">
                <ArrowRightLeft size={16} />
                Recent Transactions
              </h3>
              <LedgerTable entries={ledger} />
            </section>
          </div>

          {/* Sidebar: Form */}
          <div className="lg:col-span-4 space-y-8 sticky top-28">
            <div className="bg-slate-900/20 rounded-[2rem] p-1 shadow-inner shadow-white/[0.02]">
              <PayoutForm onSubmit={handlePayoutSubmit} isLoading={isLoading} />
            </div>
            
            <div className="bg-blue-600/5 p-6 rounded-3xl border border-blue-500/5">
              <h4 className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3">Quick Note</h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                Payouts are processed by our automated engine. Success rates are simulated for this challenge (70% Success).
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
