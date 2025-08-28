import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/services/auth-context';
import { offersApi } from '@/services/offers';
import type { Offer, PaginatedResponse } from '@/services/offers';
import toast, { Toaster } from 'react-hot-toast';
import { useUrlPagination } from '@/hooks/useUrlPagination';
import {
  Search,
  SortAsc,
  SortDesc,
  Zap,
  Clock,
  DollarSign,
  Loader2,
  Filter,
  Grid3X3,
  List
} from 'lucide-react';

import { Sidebar } from '../dashboard/sidebar';
import { authApi } from '@/services/auth';

// Helper function to format price
const formatPrice = (price: number | string): string => {
  const priceNum = typeof price === 'number' ? price : parseFloat(price) || 0;
  return priceNum.toFixed(2);
};

type SortOption = 'name' | 'price' | 'duration' | 'created_at';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';

const OfferActivation: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const { user, setUser } = useAuth();

  // Use URL-based pagination
  const { currentPage, pageSize, setCurrentPage, setPageSize } = useUrlPagination({
    defaultPage: 1,
    defaultPageSize: 12,
  });

  // Filter and sort offers
  const filteredAndSortedOffers = useMemo(() => {
    let filtered = offers.filter(offer => {
      const matchesSearch = offer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' ||
        (statusFilter === 'active' && offer.is_active) ||
        (statusFilter === 'inactive' && !offer.is_active);
      return matchesSearch && matchesStatus;
    });

    // Sort offers
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.price.toString());
          bValue = parseFloat(b.price.toString());
          break;
        case 'duration':
          aValue = a.duration_days;
          bValue = b.duration_days;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [offers, searchQuery, sortBy, sortDirection, statusFilter]);

  // Load offers on component mount and when page/pageSize changes
  useEffect(() => {
    loadOffers();
  }, [currentPage, pageSize]);

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, statusFilter, sortBy, sortDirection]);

  // Load all available offers
  const loadOffers = async () => {
    try {
      setLoading(true);
      // Load more items to enable client-side filtering and sorting
      const data: PaginatedResponse<Offer> = await offersApi.listOffers(1, 100);
      setOffers(data.results);
      setTotalPages(Math.ceil(data.count / pageSize));
      setTotalCount(data.count);
    } catch (error) {
      toast.error('Failed to load offers');
      console.error('Error loading offers:', error);
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
  const toggleSort = (newSortBy: SortOption) => {
    if (sortBy === newSortBy) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortDirection('asc');
    }
  };

  // Paginate filtered results
  const paginatedOffers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedOffers.slice(startIndex, endIndex);
  }, [filteredAndSortedOffers, currentPage, pageSize]);

  const totalFilteredPages = Math.ceil(filteredAndSortedOffers.length / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalFilteredPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col p-6 ml-64"
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className="text-3xl font-bold tracking-tight">Available Offers</h1>
                <Badge variant="outline" className="text-sm">
                  {filteredAndSortedOffers.length} of {totalCount}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Browse and activate available offers
              </p>
            </div>
            <div className='flex gap-2 items-center'>
              <Badge variant="secondary" className='text-sm px-3 py-1'>
                Balance: ${user?.account?.balance !== undefined ? user.account.balance.toFixed(2) : 'N/A'}
              </Badge>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search offers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              >
                {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Sort Options */}
          <div className="flex gap-2 mt-4">
            <Button
              variant={sortBy === 'name' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('name')}
              className="text-xs"
            >
              Name {sortBy === 'name' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'price' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('price')}
              className="text-xs"
            >
              Price {sortBy === 'price' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'duration' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('duration')}
              className="text-xs"
            >
              Duration {sortBy === 'duration' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'created_at' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('created_at')}
              className="text-xs"
            >
              Date {sortBy === 'created_at' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
          </div>
        </div>

        {/* Offers Display */}
        {paginatedOffers.length === 0 ? (
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
              {paginatedOffers.map((offer, index) => (
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

            {/* Pagination */}
            {totalFilteredPages > 1 && (
              <div className="flex justify-between items-center mt-8 bg-white rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedOffers.length)} of {filteredAndSortedOffers.length} offers
                </div>

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
              </div>
            )}
          </>
        )}
      </motion.div>

      <Toaster />
    </div>
  );
};

export default OfferActivation;