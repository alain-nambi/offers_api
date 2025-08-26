import api from './api';

// Pagination interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SubscriptionService {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be number or string depending on how it's serialized
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be number or string depending on how it's serialized
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserOffer {
  id: number;
  offer: number;
  offer_details: Offer;
  activation_date: string;
  expiration_date: string;
  is_active: boolean;
  transaction_id: string;
}

// Helper function to ensure price is a number
const getPriceAsNumber = (price: number | string): number => {
  if (typeof price === 'number') {
    return price;
  }
  return parseFloat(price) || 0;
};

export const subscriptionsApi = {
  // Get all active subscriptions for the user with pagination support
  getSubscriptions: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<UserOffer>> => {
    const response = await api.get<PaginatedResponse<UserOffer>>(`/account/subscriptions/?page=${page}&page_size=${pageSize}`);
    // Ensure price is a number in the results
    const results = response.data.results.map(subscription => ({
      ...subscription,
      offer_details: {
        ...subscription.offer_details,
        price: getPriceAsNumber(subscription.offer_details.price)
      }
    }));
    return {
      ...response.data,
      results
    };
  },
  
  // Get all active subscriptions for the user without pagination (for backward compatibility)
  getAllSubscriptions: async (): Promise<UserOffer[]> => {
    const response = await api.get<UserOffer[]>(`/account/subscriptions/`);
    // Ensure price is a number in the results
    return response.data.map(subscription => ({
      ...subscription,
      offer_details: {
        ...subscription.offer_details,
        price: getPriceAsNumber(subscription.offer_details.price)
      }
    }));
  },

  // Get transaction details
  getTransaction: async (transactionId: string) => {
    const response = await api.get(`/account/transactions/${transactionId}/`);
    return response.data;
  }
};