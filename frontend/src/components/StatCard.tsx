import type { LucideIcon } from "lucide-react";
import { formatINR } from "../utils/format";

interface StatCardProps {
  title: string;
  amount: number;
  icon: LucideIcon;
  color: string;
}

const StatCard = ({ title, amount, icon: Icon, color }: StatCardProps) => (
  <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 backdrop-blur-sm">
    <div className="flex items-center justify-between mb-4">
      <span className="text-slate-400 text-sm font-medium">{title}</span>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon size={20} />
      </div>
    </div>
    <div className="text-2xl font-bold text-white tracking-tight">
      {formatINR(amount)}
    </div>
  </div>
);

export default StatCard;
