import api from './api';

// Define the Transaction interface based on the backend model
export interface Transaction {
  id: number;
  transaction_id: string;
  user: number;
  offer: number;
  offer_details?: {
    id: number;
    name: string;
    description: string;
    price: number | string;
    duration_days: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
  };
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED';
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

// Define the paginated response interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Helper function to ensure amount is a number
const getAmountAsNumber = (amount: number | string): number => {
  if (typeof amount === 'number') {
    return amount;
  }
  return parseFloat(amount) || 0;
};

// Transactions API functions
export const transactionsApi = {
  // Get all transactions for the user with pagination support
  getTransactions: async (page: number = 1, pageSize: number = 10, status: string = 'ALL'): Promise<PaginatedResponse<Transaction>> => {
    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString()
    });
    
    // Add status filter if not 'ALL'
    if (status && status !== 'ALL') {
      params.append('status', status);
    }
    
    const response = await api.get<PaginatedResponse<Transaction>>(`/account/transactions/?${params.toString()}`);
    
    // Handle both paginated response and array response for backward compatibility
    if (Array.isArray(response.data)) {
      // Legacy array response - transform to paginated format
      return {
        count: response.data.length,
        next: null,
        previous: null,
        results: response.data.map(transaction => ({
          ...transaction,
          amount: getAmountAsNumber(transaction.amount)
        }))
      };
    } else {
      // Proper paginated response
      return {
        ...response.data,
        results: response.data.results.map(transaction => ({
          ...transaction,
          amount: getAmountAsNumber(transaction.amount)
        }))
      };
    }
  },

  // Get a specific transaction
  getTransaction: async (transactionId: string): Promise<Transaction> => {
    const response = await api.get<Transaction>(`/account/transactions/${transactionId}/`);
    return {
      ...response.data,
      amount: getAmountAsNumber(response.data.amount)
    };
  }
};