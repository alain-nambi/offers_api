import api from './api';

export interface SubscriptionService {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  name: string;
  description: string;
  price: number;
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

export const subscriptionsApi = {
  // Get all active subscriptions for the user
  getSubscriptions: async (): Promise<UserOffer[]> => {
    const response = await api.get<UserOffer[]>('/account/subscriptions/');
    return response.data;
  },

  // Get transaction details
  getTransaction: async (transactionId: string) => {
    const response = await api.get(`/account/transactions/${transactionId}/`);
    return response.data;
  }
};