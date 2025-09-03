import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sidebar } from "@/components/dashboard/sidebar";
import { useSidebar } from "@/components/dashboard/sidebar-context";
import { Header } from "@/components/dashboard/header";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProCard } from "@/components/dashboard/pro-card";
import { SubscriptionCharts } from "@/components/dashboard/subscription-charts";
import { subscriptionsApi } from '@/services/subscriptions';
import { transactionsApi } from '@/services/transactions';
import { useAuth } from '@/services/auth-context';
import { formatCurrency } from '@/utils/utils';

export default function DashboardPage() {
  const [subscriptionNumber, setSubscriptionNumber] = useState<number | string>(0);
  const [transactionNumber, setTransactionNumber] = useState<number | string>(0);

  const { user } = useAuth();
  
  // Get sidebar state
  const { isCollapsed } = useSidebar();

  // Extract balance safely with fallback to 0
  const balance = user?.account?.balance ?? 0;

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await subscriptionsApi.getCountSubscriptions();

        setSubscriptionNumber(subscriptions.active_subscriptions_count);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptionNumber('Error');
      }
    };

    const fetchTransactions = async () => {
      try {
        const transactions = await transactionsApi.getTransactions(); // Get all transactions
        setTransactionNumber(transactions.results.length);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactionNumber('Error');
      }
    };

    // Fetch both subscriptions and transactions in parallel
    Promise.all([fetchSubscriptions(), fetchTransactions()]);
  }, []);

  return (
    <motion.div 
      className="flex h-screen bg-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Sidebar />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isCollapsed ? 'ml-16' : 'ml-64'
      }`}>
        <Header />
        <main className="flex-1 p-6">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <MetricCard 
              title="Account Balance" 
              value={user?.account ? formatCurrency(balance) : 'N/A'}
              change="Your current account balance" 
              icon="wallet" 
              trend="up"
            />
            <MetricCard 
              title="Subscriptions" 
              value={subscriptionNumber}
              change="Your current active subscriptions" 
              icon="package"
              trend="up"
            />
            <MetricCard 
              title="Transactions" 
              value={transactionNumber.toString()}
              change="Total transactions this month" 
              icon="transactions"
              trend="up"
            />
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="lg:col-span-2">
              <SubscriptionCharts />
            </div>
            {/* <ProCard /> */}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}