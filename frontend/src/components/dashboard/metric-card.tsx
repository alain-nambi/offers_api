import { DollarSign, TrendingUp, Ticket, Clock, Package } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
  icon: "revenue" | "deals" | "tickets" | "time" | "package";
}

const icons = {
  revenue: DollarSign,
  deals: TrendingUp,
  tickets: Ticket,
  time: Clock,
  package: Package,
};

export function MetricCard({ title, value, change, trend, icon }: MetricCardProps) {
  const Icon = icons[icon];
  const isPositive = trend === "up";

  console.log(isPositive)

  return (
    <div className="flex flex-col justify-between bg-white p-6 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        <Icon className="w-5 h-5 text-gray-400" />
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <p className="text-xs text-muted-foreground mt-2">
        {change}
      </p>
    </div>
  );
}