import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { LedgerEntry } from '../api';
import { formatINR } from '../utils/format';

interface LedgerTableProps {
  entries: LedgerEntry[];
}

const LedgerTable = ({ entries }: LedgerTableProps) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
    <div className="p-6 border-b border-slate-800">
      <h3 className="text-lg font-semibold text-white">Recent Transactions</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-medium">Type</th>
            <th className="px-6 py-4 font-medium">Description</th>
            <th className="px-6 py-4 font-medium">Amount</th>
            <th className="px-6 py-4 font-medium">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {entries.map((e) => (
            <tr key={e.id} className="text-slate-300 hover:bg-slate-800/30 transition-colors">
              <td className="px-6 py-4">
                <div className={`p-1.5 rounded-lg w-fit ${
                  e.entry_type === 'credit' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                }`}>
                  {e.entry_type === 'credit' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                </div>
              </td>
              <td className="px-6 py-4 text-sm max-w-xs truncate">
                {e.description}
              </td>
              <td className={`px-6 py-4 text-sm font-semibold ${
                e.entry_type === 'credit' ? 'text-emerald-500' : 'text-rose-500'
              }`}>
                {e.entry_type === 'credit' ? '+' : '-'}{formatINR(e.amount_paise)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-500">
                {new Date(e.created_at).toLocaleDateString()}
              </td>
            </tr>
          ))}
          {entries.length === 0 && (
            <tr>
              <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-sm italic">
                No transactions found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default LedgerTable;
