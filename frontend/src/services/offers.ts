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

// New interface for the backend API response format
export interface OffersResponse {
  data: Offer[];
  total: number;
  page: number;
  limit: number;
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

// Interface for query parameters
export interface ListOffersParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  status?: string;
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
  // Get all offers with pagination, filtering, and sorting support
  listOffers: async (params: ListOffersParams = {}): Promise<OffersResponse> => {
    const { page = 1, limit = 10, sort, search, status } = params;
    
    // Build query parameters
    const queryParams = new URLSearchParams();
    queryParams.set('page', page.toString());
    queryParams.set('limit', limit.toString());
    
    if (sort) {
      queryParams.set('sort', sort);
    }
    
    if (search) {
      queryParams.set('search', search);
    }
    
    if (status && status !== 'all') {
      queryParams.set('status', status);
    }
    
    const queryString = queryParams.toString();
    const url = `/offers${queryString ? `?${queryString}` : ''}`;
    
    try {
      const response = await api.get(url);
      
      // Handle the new response format { data: [...], total: 120, page: 1, limit: 10 }
      if (response.data && Array.isArray(response.data.data)) {
        // Ensure price is a number in the results
        const processedData = response.data.data.map((offer: Offer) => ({
          ...offer,
          price: getPriceAsNumber(offer.price)
        }));
        
        return {
          data: processedData,
          total: response.data.total || 0,
          page: response.data.page || page,
          limit: response.data.limit || limit
        };
      }
      
      // Fallback for other response formats
      let data: Offer[] = [];
      let total = 0;
      let currentPage = page;
      let currentLimit = limit;
      
      // Check if response has the old format { results: [...], count: 120 }
      if (response.data && Array.isArray(response.data.results)) {
        data = response.data.results;
        total = response.data.count || 0;
        currentPage = page;
        currentLimit = limit;
      }
      // If response is directly an array
      else if (response.data && Array.isArray(response.data)) {
        data = response.data;
        total = data.length;
        currentPage = page;
        currentLimit = limit;
      }
      
      // Ensure price is a number in the results
      const processedData = data.map((offer: Offer) => ({
        ...offer,
        price: getPriceAsNumber(offer.price)
      }));
      
      return {
        data: processedData,
        total,
        page: currentPage,
        limit: currentLimit
      };
    } catch (error) {
      console.error('Error fetching offers:', error);
      throw error;
    }
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