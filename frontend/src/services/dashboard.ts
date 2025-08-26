import api from './api';

// Define interfaces for chart data
export interface RevenueDataPoint {
  name: string;
  revenue: number;
}

export interface TicketDataPoint {
  name: string;
  created: number;
  solved: number;
}

// Local Transaction interface to avoid circular dependency
interface Transaction {
  id: number;
  transaction_id: string;
  user: number;
  offer: number;
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Helper function to generate mock revenue data based on real transactions
const generateRevenueData = (transactions: Transaction[]): RevenueDataPoint[] => {
  // Group transactions by month
  const monthlyRevenue: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    if (transaction.status === 'SUCCESS') {
      const date = new Date(transaction.created_at);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyRevenue[monthKey]) {
        monthlyRevenue[monthKey] = 0;
      }
      
      monthlyRevenue[monthKey] += transaction.amount;
    }
  });
  
  // Convert to array format for the chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();
  
  return months.map((month, index) => {
    const monthKey = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`;
    return {
      name: month,
      revenue: Math.round(monthlyRevenue[monthKey] || 0)
    };
  });
};

// Helper function to generate mock ticket data based on transactions
const generateTicketData = (transactions: Transaction[]): TicketDataPoint[] => {
  // Group transactions by month for created and solved tickets
  const monthlyCreated: Record<string, number> = {};
  const monthlySolved: Record<string, number> = {};
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.created_at);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    
    // Count as created
    if (!monthlyCreated[monthKey]) {
      monthlyCreated[monthKey] = 0;
    }
    monthlyCreated[monthKey] += 1;
    
    // Count as solved if successful
    if (transaction.status === 'SUCCESS') {
      if (!monthlySolved[monthKey]) {
        monthlySolved[monthKey] = 0;
      }
      monthlySolved[monthKey] += 1;
    }
  });
  
  // Convert to array format for the chart
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
  const currentYear = new Date().getFullYear();
  
  return months.map((month, index) => {
    const monthKey = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`;
    return {
      name: month,
      created: monthlyCreated[monthKey] || 0,
      solved: monthlySolved[monthKey] || 0
    };
  });
};

// Dashboard API functions
export const dashboardApi = {
  // Get revenue chart data
  getRevenueData: async (): Promise<RevenueDataPoint[]> => {
    try {
      // Fetch all transactions to generate revenue data
      const response = await api.get<Transaction[]>('/account/transactions/');
      return generateRevenueData(response.data);
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      // Return mock data as fallback
      return [
        { name: "Jan", revenue: 4000 },
        { name: "Feb", revenue: 3000 },
        { name: "Mar", revenue: 5000 },
        { name: "Apr", revenue: 4500 },
        { name: "May", revenue: 6000 },
        { name: "Jun", revenue: 5500 },
        { name: "Jul", revenue: 7000 },
        { name: "Aug", revenue: 6500 },
        { name: "Sep", revenue: 8000 },
        { name: "Oct", revenue: 7500 },
        { name: "Nov", revenue: 9000 },
        { name: "Dec", revenue: 8500 },
      ];
    }
  },

  // Get ticket chart data
  getTicketData: async (): Promise<TicketDataPoint[]> => {
    try {
      // Fetch all transactions to generate ticket data
      const response = await api.get<Transaction[]>('/account/transactions/');
      return generateTicketData(response.data);
    } catch (error) {
      console.error('Error fetching ticket data:', error);
      // Return mock data as fallback
      return [
        { name: "Jan", created: 45, solved: 38 },
        { name: "Feb", created: 52, solved: 48 },
        { name: "Mar", created: 38, solved: 42 },
        { name: "Apr", created: 65, solved: 55 },
        { name: "May", created: 48, solved: 50 },
        { name: "Jun", created: 55, solved: 60 },
      ];
    }
  }
};