import { type LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  color: string;
}

const StatCard = ({ title, amount, icon: Icon, color }: StatCardProps) => (
  <div className="bg-slate-900/40 rounded-3xl p-6 transition-all hover:bg-slate-900/60 group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} transition-transform group-hover:scale-110`}>
        <Icon size={20} />
      </div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{title}</span>
    </div>
    <div className="text-2xl font-bold tracking-tight text-white">
      ₹{(amount / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
    </div>
  </div>
);

export default StatCard;
