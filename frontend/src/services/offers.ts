import api from './api';

// Offer interface
export interface Offer {
  id: number;
  name: string;
  description: string;
  price: number;
  duration_days: number;
  created_at: string;
  is_active: boolean;
}

// UserOffer interface
export interface UserOffer {
  id: number;
  user: number;
  offer: number;
  transaction_id: string;
  is_active: boolean;
  expiration_date: string;
  created_at: string;
}

// Activation response interface
export interface ActivationResponse {
  transaction_id: string;
  message: string;
  status: string;
}

// Activation status interface
export interface ActivationStatus {
  transaction_id: string;
  user_id: string;
  offer_id: string;
  amount: string;
  status: string;
  created_at: string;
  updated_at: string;
}

// Offers API functions
export const offersApi = {
  // Get all offers
  listOffers: async (): Promise<Offer[]> => {
    const response = await api.get<Offer[]>('/offers/');
    return response.data;
  },

  // Get a specific offer
  getOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.get<Offer>(`/offers/${offerId}/`);
    return response.data;
  },

  // Activate an offer
  activateOffer: async (offerId: number): Promise<ActivationResponse> => {
    const response = await api.post<ActivationResponse>('/activation/activate/', { offer_id: offerId });
    return response.data;
  },

  // Get activation status
  getActivationStatus: async (transactionId: string): Promise<ActivationStatus> => {
    const response = await api.get<ActivationStatus>(`/activation/status/${transactionId}/`);
    return response.data;
  },

  // Get expiring offers
  getExpiringOffers: async (): Promise<UserOffer[]> => {
    const response = await api.get<UserOffer[]>('/offers/expiring/');
    return response.data;
  }
};