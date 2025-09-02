import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { offersApi } from '@/services/offers';
import { authApi } from '@/services/auth';
import { useAuth } from '@/services/auth-context';
import type { Offer } from '@/services/offers';
import { toast, Toaster } from 'react-hot-toast';
import {
  DollarSign,
  Clock,
  Zap,
  Loader2,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';
import { Sidebar } from '../dashboard/sidebar';
import { useSidebar } from '../dashboard/sidebar-context';
import { useUrlPagination } from '@/hooks/useUrlPagination';

// Helper function to format price
const formatPrice = (price: number | string): string => {
  const priceNum = typeof price === 'number' ? price : parseFloat(price) || 0;
  return priceNum.toFixed(2);
};

type SortOption = 'name' | '-name' | 'price' | '-price' | 'duration_days' | '-duration_days' | 'created_at' | '-created_at';
type ViewMode = 'grid' | 'list';

export default function OfferActivation() {
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { user, setUser } = useAuth();

  // Get sidebar state
  const { isCollapsed } = useSidebar();

  // Use URL-based pagination with status filter
  const { currentPage, pageSize, statusFilter, setCurrentPage, setPageSize, setStatusFilter } = useUrlPagination({
    defaultPage: 1,
    defaultPageSize: 12,
    defaultStatus: 'all'
  });

  // Convert URL status filter to our format
  const normalizedStatusFilter = statusFilter.toLowerCase() as 'all' | 'active' | 'inactive';

  // Parse URL parameters on component mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Set search query from URL
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchQuery(searchParam);
      setDebouncedSearchQuery(searchParam);
    }
    
    // Set sort from URL
    const sortParam = searchParams.get('sort') as SortOption;
    if (sortParam && ['name', '-name', 'price', '-price', 'duration_days', '-duration_days', 'created_at', '-created_at'].includes(sortParam)) {
      setSortBy(sortParam);
    }
    
    // Set status filter from URL
    const statusParam = searchParams.get('status');
    if (statusParam) {
      setStatusFilter(statusParam);
    }
    
    // Set page from URL
    const pageParam = searchParams.get('page');
    if (pageParam) {
      const pageNum = parseInt(pageParam, 10);
      if (!isNaN(pageNum) && pageNum > 0) {
        if (pageNum !== currentPage) {
          setCurrentPage(pageNum);
        }
      }
    }
    
    // Set limit from URL
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limitNum = parseInt(limitParam, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        if (limitNum !== pageSize) {
          setPageSize(limitNum);
        }
      }
    }
  }, []);
  
  // Debounce search query with 500ms delay
  useEffect(() => {
    // Clear the previous timeout
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Don't trigger API call immediately when component mounts
    if (searchQuery === '' && debouncedSearchQuery === '') {
      return;
    }
    
    // Set a new timeout
    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      // Reset to first page when search query changes
      setCurrentPage(1);
    }, 500); // 500ms debounce delay
    
    // Cleanup function to clear timeout on unmount or when searchQuery changes
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery]);

  // Update URL when filters change
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    
    // Update search query in URL
    if (searchQuery) {
      searchParams.set('search', searchQuery);
    } else {
      searchParams.delete('search');
    }
    
    // Update sort in URL
    if (sortBy !== 'name') { // name is default
      searchParams.set('sort', sortBy);
    } else {
      searchParams.delete('sort');
    }
    
    // Update status filter in URL
    if (normalizedStatusFilter !== 'all') {
      searchParams.set('status', normalizedStatusFilter);
    } else {
      searchParams.delete('status');
    }
    
    // Update page and limit
    if (currentPage !== 1) {
      searchParams.set('page', currentPage.toString());
    } else {
      searchParams.delete('page');
    }
    
    if (pageSize !== 12) { // 12 is default
      searchParams.set('limit', pageSize.toString());
    } else {
      searchParams.delete('limit');
    }
    
    const newUrl = searchParams.toString();
    const currentPath = window.location.pathname;
    const fullUrl = newUrl ? `${currentPath}?${newUrl}` : currentPath;
    
    window.history.replaceState({}, '', fullUrl);
  }, [searchQuery, sortBy, normalizedStatusFilter, currentPage, pageSize]);

  // Load offers on component mount and when page/pageSize/search/sort/status changes
  useEffect(() => {
    loadOffers();
  }, [currentPage, pageSize, debouncedSearchQuery, sortBy, normalizedStatusFilter]);

  // Load offers from backend with pagination, filtering, and sorting
  const loadOffers = async () => {
    try {
      setLoading(true);
      
      // Prepare query parameters
      const params = {
        page: currentPage,
        limit: pageSize,
        sort: sortBy !== 'name' ? sortBy : undefined, // Don't send 'name' as it's default
        search: searchQuery || undefined,
        status: normalizedStatusFilter !== 'all' ? normalizedStatusFilter : undefined
      };
      
      // Make API request with all parameters
      const response = await offersApi.listOffers(params);
      
      setOffers(response.data || []);
      setTotalCount(response.total || 0);
    } catch (error: any) {
      console.error('Error loading offers:', error);
      toast.error(`Failed to load offers: ${error.message || 'Unknown error'}`);
      // Set default values on error
      setOffers([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Activate an offer
  const activateOffer = async (offerId: number) => {
    setActivating(offerId);
    try {
      const response = await offersApi.activateOffer(offerId);
      toast.success('Activation started! Check status in transactions.');

      // Refresh user data to update balance
      const userData = await authApi.profile();
      setUser(userData);

      // Poll for activation status
      pollActivationStatus(response.transaction_id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to activate offer');
      console.error('Error activating offer:', error);
    } finally {
      setActivating(null);
    }
  };

  // Poll for activation status updates
  const pollActivationStatus = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await offersApi.getActivationStatus(transactionId);

        if (status.status === 'SUCCESS' || status.status === 'FAILED') {
          clearInterval(interval);

          if (status.status === 'SUCCESS') {
            toast.success('Offer activated successfully!');
          } else {
            toast.error('Offer activation failed');
          }
        }
      } catch (error) {
        console.error('Error polling activation status:', error);
        toast.error('Error checking activation status');
        clearInterval(interval);
      }
    }, 3000);
  };

  // Toggle sort direction
  const toggleSort = (newSortField: string) => {
    let newSortBy: SortOption;
    
    // If we're already sorting by this field, toggle direction
    if (sortBy === newSortField) {
      // Toggle to descending
      newSortBy = `-${newSortField}` as SortOption;
    } else if (sortBy === `-${newSortField}`) {
      // Toggle back to ascending (default)
      newSortBy = newSortField as SortOption;
    } else {
      // Set new sort field (default to ascending)
      newSortBy = newSortField as SortOption;
    }
    
    setSortBy(newSortBy);
  };

  const totalFilteredPages = Math.ceil(totalCount / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalFilteredPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen w-full">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar />

      <motion.div
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header - Improved design with less vertical space */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">Available Offers</h1>
              <Badge variant="outline" className="text-xs">
                {offers.length} of {totalCount}
              </Badge>
            </div>
            <div>
              <Badge variant="secondary" className='text-xs px-2 py-1'>
                Balance: ${user?.account?.balance !== undefined ? user.account.balance.toFixed(2) : 'N/A'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Filters - Compacted */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-1 text-sm"
              />
            </div>

            <Select value={normalizedStatusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
              <SelectTrigger className="w-[120px] py-1 text-sm">
                <Filter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value, 10))}>
              <SelectTrigger className="w-[100px] py-1 text-sm">
                <SelectValue placeholder="Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 items</SelectItem>
                <SelectItem value="12">12 items</SelectItem>
                <SelectItem value="18">18 items</SelectItem>
                <SelectItem value="24">24 items</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="px-2"
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Sort Options */}
        <div className="bg-white border-b px-6 py-2">
          <div className="flex gap-1 flex-wrap">
            <Button
              variant={sortBy === 'name' || sortBy === '-name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('name')}
              className="text-xs px-2 py-1 h-7"
            >
              Name {sortBy === 'name' && <SortAsc className="ml-1 h-3 w-3" />}{sortBy === '-name' && <SortDesc className="ml-1 h-3 w-3" />}
            </Button>
            <Button
              variant={sortBy === 'price' || sortBy === '-price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('price')}
              className="text-xs px-2 py-1 h-7"
            >
              Price {sortBy === 'price' && <SortAsc className="ml-1 h-3 w-3" />}{sortBy === '-price' && <SortDesc className="ml-1 h-3 w-3" />}
            </Button>
            <Button
              variant={sortBy === 'duration_days' || sortBy === '-duration_days' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('duration_days')}
              className="text-xs px-2 py-1 h-7"
            >
              Duration {sortBy === 'duration_days' && <SortAsc className="ml-1 h-3 w-3" />}{sortBy === '-duration_days' && <SortDesc className="ml-1 h-3 w-3" />}
            </Button>
            <Button
              variant={sortBy === 'created_at' || sortBy === '-created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('created_at')}
              className="text-xs px-2 py-1 h-7"
            >
              Date {sortBy === 'created_at' && <SortAsc className="ml-1 h-3 w-3" />}{sortBy === '-created_at' && <SortDesc className="ml-1 h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {/* Offers Display */}
          {offers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="text-muted-foreground mb-2">No offers found</div>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <motion.div
                className={viewMode === 'grid'
                  ? "grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                  : "space-y-3"
                }
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {offers.map((offer, index) => (
                  <motion.div
                    key={offer.id}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.05 * index, duration: 0.3 }}
                    className={viewMode === 'grid' ? '' : 'w-full'}
                  >
                    {viewMode === 'grid' ? (
                      // Grid Card View
                      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{offer.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{offer.description}</p>
                          </div>
                          <Badge variant={offer.is_active ? "default" : "secondary"} className="ml-2 text-xs">
                            {offer.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Price
                            </div>
                            <span className="font-bold text-lg">${formatPrice(offer.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              Duration
                            </div>
                            <span className="font-medium">{offer.duration_days} days</span>
                          </div>
                        </div>

                        <Button
                          className="w-full"
                          size="sm"
                          onClick={() => activateOffer(offer.id)}
                          disabled={!offer.is_active || activating === offer.id || !user || (user.account?.balance !== undefined && user.account.balance < Number(offer.price))}
                        >
                          {activating === offer.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Activating...
                            </>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      </div>
                    ) : (
                      // List View
                      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{offer.name}</h3>
                              <Badge variant={offer.is_active ? "default" : "secondary"} className="text-xs">
                                {offer.is_active ? "Active" : "Inactive"}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{offer.description}</p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-bold text-lg text-foreground">${formatPrice(offer.price)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{offer.duration_days} days</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4">
                            <Button
                              onClick={() => activateOffer(offer.id)}
                              disabled={!offer.is_active || activating === offer.id || !user || (user.account?.balance !== undefined && user.account.balance < Number(offer.price))}
                            >
                              {activating === offer.id ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Activating...
                                </>
                              ) : (
                                <>
                                  <Zap className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </motion.div>

              {/* Pagination - Always show if there are offers */}
              {offers.length > 0 && (
                <div className="flex justify-between items-center mt-6 bg-white rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} offers
                  </div>

                  {totalFilteredPages > 1 && (
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        variant="outline"
                        size="sm"
                      >
                        Previous
                      </Button>

                      <div className="flex items-center space-x-1">
                        {Array.from({ length: Math.min(5, totalFilteredPages) }, (_, i) => {
                          let page;
                          if (totalFilteredPages <= 5) {
                            page = i + 1;
                          } else if (currentPage <= 3) {
                            page = i + 1;
                          } else if (currentPage >= totalFilteredPages - 2) {
                            page = totalFilteredPages - 4 + i;
                          } else {
                            page = currentPage - 2 + i;
                          }

                          return (
                            <Button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              variant={page === currentPage ? "default" : "outline"}
                              size="sm"
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                      </div>

                      <Button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalFilteredPages}
                        variant="outline"
                        size="sm"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <Toaster />
    </div>
  );
};