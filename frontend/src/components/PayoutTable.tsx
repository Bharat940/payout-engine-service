import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { Payout } from "../api";
import { formatINR } from "../utils/format";

interface PayoutTableProps {
  payouts: Payout[];
}

const PayoutTable = ({ payouts }: PayoutTableProps) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
    <div className="p-6 border-b border-slate-800">
      <h3 className="text-lg font-semibold text-white">Payout History</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-6 py-4 font-medium">Date</th>
            <th className="px-6 py-4 font-medium">Amount</th>
            <th className="px-6 py-4 font-medium">Bank</th>
            <th className="px-6 py-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800">
          {payouts.map((p) => (
            <tr
              key={p.id}
              className="text-slate-300 hover:bg-slate-800/30 transition-colors"
            >
              <td className="px-6 py-4 text-sm">
                {new Date(p.created_at).toLocaleDateString()}
              </td>
              <td className="px-6 py-4 text-sm font-semibold text-white">
                {formatINR(p.amount_paise)}
              </td>
              <td className="px-6 py-4 text-sm">
                {p.bank_account_details.bank_name}
              </td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                    p.status === "completed"
                      ? "bg-emerald-500/10 text-emerald-500"
                      : p.status === "processing"
                        ? "bg-amber-500/10 text-amber-500"
                        : p.status === "failed"
                          ? "bg-rose-500/10 text-rose-500"
                          : "bg-slate-500/10 text-slate-400"
                  }`}
                >
                  {p.status === "completed" && <CheckCircle2 size={12} />}
                  {p.status === "processing" && (
                    <Clock size={12} className="animate-pulse" />
                  )}
                  {p.status === "failed" && <AlertCircle size={12} />}
                  {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                </span>
              </td>
            </tr>
          ))}
          {payouts.length === 0 && (
            <tr>
              <td
                colSpan={4}
                className="px-6 py-10 text-center text-slate-500 text-sm italic"
              >
                No payouts found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </div>
);

export default PayoutTable;
