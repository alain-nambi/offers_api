import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TicketChart } from "@/components/dashboard/ticket-chart";
import { ProCard } from "@/components/dashboard/pro-card";

export default function DashboardPage() {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <MetricCard title="Product Revenue" value="€4,250" change="+8%" trend="up" icon="revenue" />
            <MetricCard title="Total Deals" value="1,625" change="-5%" trend="down" icon="deals" />
            <MetricCard title="Created Tickets" value="3,452" change="+16%" trend="up" icon="tickets" />
            <MetricCard title="Average Reply" value="8:02" change="+4%" trend="up" icon="time" />
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