import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TicketChart } from "@/components/dashboard/ticket-chart";
import { ProCard } from "@/components/dashboard/pro-card";
import BalanceCard from "@/components/dashboard/balance-card";
import { subscriptionsApi } from '@/services/subscriptions';

export default function DashboardPage() {
  const [subscriptionNumber, setSubscriptionNumber] = useState<number | 0>(0);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await subscriptionsApi.getSubscriptions();
        setSubscriptionNumber(subscriptions.length);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
      }
    };

    fetchSubscriptions();
  }, []);

  return (
    <motion.div 
      className="flex h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
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
              value={subscriptionNumber.toString()}
              change="Your current active subscriptions" 
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
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <ProCard />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            <TicketChart />
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}