import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TicketChart } from "@/components/dashboard/ticket-chart";
import { ProCard } from "@/components/dashboard/pro-card";
import BalanceCard from "@/components/dashboard/balance-card";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <BalanceCard />
            <MetricCard 
              title="Revenue" 
              value="$24,800" 
              change="+12.5% from last month" 
              icon="revenue" 
              trend="up"
            />
            <MetricCard 
              title="Subscriptions" 
              value="1,240" 
              change="+18.2% from last month" 
              icon="package" 
              trend="up"
            />
            <MetricCard 
              title="Tickets" 
              value="240" 
              change="-2.5% from last month" 
              icon="tickets" 
              trend="down"
            />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <ProCard />
          </div>

          <TicketChart />
        </main>
      </div>
    </div>
  );
}