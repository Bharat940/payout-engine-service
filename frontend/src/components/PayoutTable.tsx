import { type Payout } from "../api";

interface PayoutTableProps {
  payouts: Payout[];
}

const PayoutTable = ({ payouts }: PayoutTableProps) => {
  return (
    <div className="bg-slate-900/20 rounded-[2rem] overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white/[0.02]">
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Bank</th>
              <th className="px-6 py-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {payouts.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-slate-500 text-sm italic">
                  No payouts found
                </td>
              </tr>
            ) : payouts.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4 text-sm text-slate-400">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm font-bold">
                  ₹{(p.amount_paise / 100).toLocaleString('en-IN')}
                </td>
                <td className="px-6 py-4 text-xs text-slate-500 italic">
                  {p.bank_account_details ? `${p.bank_account_details.bank_name} - **** ${p.bank_account_details.account_number.slice(-4)}` : 'N/A'}
                </td>
                <td className="px-6 py-4">
                  <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full ${
                    p.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                    p.status === 'failed' ? 'bg-rose-500/10 text-rose-500' :
                    'bg-amber-500/10 text-amber-500'
                  }`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PayoutTable;
