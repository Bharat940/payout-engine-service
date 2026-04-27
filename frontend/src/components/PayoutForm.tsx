import React, { useState } from 'react';
import { Send, Clock } from 'lucide-react';

interface PayoutFormProps {
  onSubmit: (amount: number, bankId: number) => Promise<void>;
  isLoading: boolean;
}

const PayoutForm = ({ onSubmit, isLoading }: PayoutFormProps) => {
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('1');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    onSubmit(Number(amount) * 100, Number(bankId));
    setAmount('');
  };

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm h-full">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
        <Send size={20} className="text-blue-500" />
        Request Payout
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Amount (₹)</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 500"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">Select Bank Account</label>
          <select 
            value={bankId}
            onChange={(e) => setBankId(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all appearance-none"
          >
            <option value="1">HDFC Bank - **** 1234</option>
            <option value="2">ICICI Bank - **** 5678</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <Clock className="animate-spin" size={18} />
          ) : (
            <>
              <Send size={18} />
              Submit Request
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default PayoutForm;
