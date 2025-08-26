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
import { transactionsApi } from '@/services/transactions';

export default function DashboardPage() {
  const [subscriptionNumber, setSubscriptionNumber] = useState<number | string>(0);
  const [transactionNumber, setTransactionNumber] = useState<number | string>(0);
  const [isRevenueLoading, setIsRevenueLoading] = useState(true);
  const [isTicketsLoading, setIsTicketsLoading] = useState(true);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const subscriptions = await subscriptionsApi.getAllSubscriptions();
        setSubscriptionNumber(subscriptions.length);
      } catch (error) {
        console.error('Error fetching subscriptions:', error);
        setSubscriptionNumber('Error');
      }
    };

    const fetchTransactions = async () => {
      try {
        const transactions = await transactionsApi.getTransactions(1, 100); // Get all transactions
        setTransactionNumber(transactions.results.length);
      } catch (error) {
        console.error('Error fetching transactions:', error);
        setTransactionNumber('Error');
      }
    };

    fetchSubscriptions();
    fetchTransactions();
    
    // Simulate data fetching for charts
    const loadRevenue = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsRevenueLoading(false);
      } catch (error) {
        console.error('Error loading revenue chart:', error);
        setIsRevenueLoading(false);
      }
    };

    const loadTickets = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsTicketsLoading(false);
      } catch (error) {
        console.error('Error loading tickets:', error);
        setIsTicketsLoading(false);
      }
    };

    loadRevenue();
    loadTickets();
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
              title="Transactions" 
              value={transactionNumber.toString()}
              change="Total transactions this month" 
              icon="transactions"
              trend="up"
            />
          </motion.div>
          
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            <div className="lg:col-span-2">
              {isRevenueLoading ? (
                <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                  <p className="text-gray-500">Loading revenue data...</p>
                </div>
              ) : (
                <RevenueChart />
              )}
            </div>
            <ProCard />
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {isTicketsLoading ? (
              <div className="flex justify-center items-center h-64 bg-white rounded-lg shadow">
                <p className="text-gray-500">Loading ticket data...</p>
              </div>
            ) : (
              <TicketChart />
            )}
          </motion.div>
        </main>
      </div>
    </motion.div>
  );
}