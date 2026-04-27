import { type LedgerEntry } from "../api";

interface LedgerTableProps {
  entries: LedgerEntry[];
}

const LedgerTable = ({ entries }: LedgerTableProps) => {
  return (
    <div className="bg-slate-900/20 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.02]">
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4 text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {entries.map((entry) => (
              <tr key={entry.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    entry.entry_type === 'credit' ? 'text-emerald-500' : 'text-rose-400'
                  }`}>
                    {entry.entry_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                  {entry.description}
                </td>
                <td className={`px-6 py-4 text-sm font-bold ${
                  entry.entry_type === 'credit' ? 'text-emerald-500' : 'text-slate-200'
                }`}>
                  {entry.entry_type === 'credit' ? '+' : '-'}₹{(entry.amount_paise / 100).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-right text-xs text-slate-500 font-medium">
                  {new Date(entry.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LedgerTable;
