import { useState, useEffect } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line } from "recharts";
import { subscriptionsApi } from '@/services/subscriptions';
import { Loader2 } from 'lucide-react';

// Define types for our chart data
interface SubscriptionByOfferData {
  name: string;
  value: number;
  color: string;
}

interface SubscriptionByMonthData {
  month: string;
  subscriptions: number;
}

interface SubscriptionAmountData {
  month: string;
  amount: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FF6B6B', '#4ECDC4'];

export function SubscriptionCharts() {
  const [subscriptionByOfferData, setSubscriptionByOfferData] = useState<SubscriptionByOfferData[]>([]);
  const [subscriptionByMonthData, setSubscriptionByMonthData] = useState<SubscriptionByMonthData[]>([]);
  const [subscriptionAmountData, setSubscriptionAmountData] = useState<SubscriptionAmountData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all subscriptions
        let allSubscriptions: any[] = [];
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const response = await subscriptionsApi.getSubscriptions(page, 100);
          allSubscriptions = [...allSubscriptions, ...response.results];
          hasMore = response.next !== null;
          page++;
        }

        // Process data for subscription by offer (pie chart)
        const offerMap: Record<string, number> = {};
        let totalAmount = 0;
        
        allSubscriptions.forEach(sub => {
          const offerName = sub.offer_details?.name || 'Unknown Offer';
          offerMap[offerName] = (offerMap[offerName] || 0) + 1;
          totalAmount += typeof sub.offer_details?.price === 'number' ? sub.offer_details.price : 0;
        });

        const subscriptionByOffer = Object.entries(offerMap).map(([name, value], index) => ({
          name,
          value,
          color: COLORS[index % COLORS.length]
        }));

        // Process data for subscriptions by month
        const monthMap: Record<string, { count: number; amount: number }> = {};
        
        allSubscriptions.forEach(sub => {
          const date = new Date(sub.activation_date);
          const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          
          if (!monthMap[monthKey]) {
            monthMap[monthKey] = { count: 0, amount: 0 };
          }
          
          monthMap[monthKey].count += 1;
          monthMap[monthKey].amount += typeof sub.offer_details?.price === 'number' ? sub.offer_details.price : 0;
        });

        // Convert to arrays and sort by month
        const sortedMonths = Object.keys(monthMap).sort();
        
        const subscriptionByMonth = sortedMonths.map(key => ({
          month: key, // We'll format this properly in the chart
          subscriptions: monthMap[key].count
        }));
        
        const subscriptionAmounts = sortedMonths.map(key => ({
          month: key, // We'll format this properly in the chart
          amount: monthMap[key].amount
        }));

        setSubscriptionByOfferData(subscriptionByOffer);
        setSubscriptionByMonthData(subscriptionByMonth);
        setSubscriptionAmountData(subscriptionAmounts);
      } catch (err) {
        setError('Failed to load subscription data');
        console.error('Error loading subscription data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm h-80 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg border shadow-sm h-80 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-2">Error loading data</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Format month names for display
  const formatMonthData = (data: any[]) => {
    return data.map(item => ({
      ...item,
      month: new Date(item.month + '-01').toLocaleString('default', { month: 'short', year: 'numeric' })
    }));
  };

  const formattedMonthData = formatMonthData(subscriptionByMonthData);
  const formattedAmountData = formatMonthData(subscriptionAmountData);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Subscriptions by Offer */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscriptions by Offer</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionByOfferData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : 0}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {subscriptionByOfferData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Subscriptions']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart - Subscriptions by Month */}
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Subscriptions by Month</h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={formattedMonthData}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 50,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month" 
                  angle={-45} 
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="subscriptions" fill="#0088FE" name="Subscriptions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Line Chart - Subscription Amount by Month */}
      <div className="bg-white p-6 rounded-lg border shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Total Subscription Amount by Month</h3>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedAmountData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 50,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                angle={-45} 
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="amount" 
                stroke="#00C49F" 
                activeDot={{ r: 8 }} 
                name="Amount ($)"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}