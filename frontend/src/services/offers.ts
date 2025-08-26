import api from './api';

// Offer interface
export interface Offer {
  id: number;
  name: string;
  description: string;
  price: number | string; // Can be number or string depending on how it's serialized
  duration_days: number;
  created_at: string;
  is_active: boolean;
}

// Pagination interface
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
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

// Helper function to ensure price is a number
const getPriceAsNumber = (price: number | string): number => {
  if (typeof price === 'number') {
    return price;
  }
  return parseFloat(price) || 0;
};

// Offers API functions
export const offersApi = {
  // Get all offers with pagination support
  listOffers: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<Offer>> => {
    const response = await api.get<PaginatedResponse<Offer>>(`/offers/?page=${page}&page_size=${pageSize}`);
    // Ensure price is a number in the results
    const results = response.data.results.map(offer => ({
      ...offer,
      price: getPriceAsNumber(offer.price)
    }));
    return {
      ...response.data,
      results
    };
  },

  // Get a specific offer
  getOffer: async (offerId: number): Promise<Offer> => {
    const response = await api.get<Offer>(`/offers/${offerId}/`);
    return {
      ...response.data,
      price: getPriceAsNumber(response.data.price)
    };
  },

  // Activate an offer
  activateOffer: async (offerId: number): Promise<ActivationResponse> => {
    const response = await api.post<ActivationResponse>('/activation/', { offer_id: offerId });
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