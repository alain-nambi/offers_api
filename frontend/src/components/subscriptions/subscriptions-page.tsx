import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { subscriptionsApi } from '@/services/subscriptions';
import type { UserOffer, PaginatedResponse } from '@/services/subscriptions';
import { useUrlPagination } from '@/hooks/useUrlPagination';
import {
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Grid3X3,
  List,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Sidebar } from '../dashboard/sidebar';

type SortOption = 'name' | 'price' | 'activation_date' | 'expiration_date' | 'time_remaining';
type SortDirection = 'asc' | 'desc';
type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'active' | 'expiring_soon' | 'expired';

const SubscriptionsPage: React.FC = () => {
  const [subscriptions, setSubscriptions] = useState<UserOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('expiration_date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Use URL-based pagination with status filter
  const { currentPage, pageSize, statusFilter, setCurrentPage, setPageSize, setStatusFilter } = useUrlPagination({
    defaultPage: 1,
    defaultPageSize: 12,
    defaultStatus: 'all'
  });

  // Convert URL status filter to our format
  const normalizedStatusFilter = statusFilter.toLowerCase() as StatusFilter;

  useEffect(() => {
    loadSubscriptions();
  }, [currentPage, pageSize]);

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, sortBy, sortDirection]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      // Load more items to enable client-side filtering and sorting
      const data: PaginatedResponse<UserOffer> = await subscriptionsApi.getSubscriptions(1, 100);
      setSubscriptions(data.results);
      setTotalCount(data.count);
    } catch (err) {
      setError('Failed to load subscriptions');
      console.error('Error loading subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let filtered = subscriptions.filter(subscription => {
      const matchesSearch = subscription.offer_details.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subscription.offer_details.description.toLowerCase().includes(searchQuery.toLowerCase());

      const now = new Date();
      const expirationDate = new Date(subscription.expiration_date);
      const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const matchesStatus = normalizedStatusFilter === 'all' ||
        (normalizedStatusFilter === 'active' && subscription.is_active && daysRemaining > 0) ||
        (normalizedStatusFilter === 'expiring_soon' && subscription.is_active && daysRemaining <= 7 && daysRemaining > 0) ||
        (normalizedStatusFilter === 'expired' && daysRemaining <= 0);

      return matchesSearch && matchesStatus;
    });

    // Sort subscriptions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'name':
          aValue = a.offer_details.name.toLowerCase();
          bValue = b.offer_details.name.toLowerCase();
          break;
        case 'price':
          aValue = parseFloat(a.offer_details.price.toString());
          bValue = parseFloat(b.offer_details.price.toString());
          break;
        case 'activation_date':
          aValue = new Date(a.activation_date);
          bValue = new Date(b.activation_date);
          break;
        case 'expiration_date':
          aValue = new Date(a.expiration_date);
          bValue = new Date(b.expiration_date);
          break;
        case 'time_remaining':
          const nowTime = new Date().getTime();
          aValue = new Date(a.expiration_date).getTime() - nowTime;
          bValue = new Date(b.expiration_date).getTime() - nowTime;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [subscriptions, searchQuery, sortBy, sortDirection, normalizedStatusFilter]);

  // Paginate filtered results
  const paginatedSubscriptions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedSubscriptions.slice(startIndex, endIndex);
  }, [filteredAndSortedSubscriptions, currentPage, pageSize]);

  const totalFilteredPages = Math.ceil(filteredAndSortedSubscriptions.length / pageSize);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalFilteredPages) {
      setCurrentPage(newPage);
    }
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

  const formatCurrency = (amount: number | string): string => {
    const amountNum = typeof amount === 'number' ? amount : parseFloat(amount) || 0;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amountNum);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeRemaining = (expirationDate: string) => {
    const expiration = new Date(expirationDate);
    const now = new Date();
    const diffTime = expiration.getTime() - now.getTime();

    if (diffTime <= 0) {
      return { text: 'Expired', status: 'expired' as const };
    }

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 7) {
      return { text: `${diffDays} days`, status: 'expiring_soon' as const };
    }

    return { text: `${diffDays} days`, status: 'active' as const };
  };

  const getStatusBadge = (subscription: UserOffer) => {
    const timeRemaining = getTimeRemaining(subscription.expiration_date);

    if (timeRemaining.status === 'expired') {
      return <Badge variant="destructive" className="text-xs">Expired</Badge>;
    } else if (timeRemaining.status === 'expiring_soon') {
      return <Badge variant="secondary" className="text-xs">Expiring Soon</Badge>;
    } else {
      return <Badge variant="default" className="text-xs">Active</Badge>;
    }
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="flex flex-col items-center">
  //         <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //         <p className="mt-2 text-muted-foreground">Loading subscriptions...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center items-center h-64"
      >
        <div className="bg-white rounded-lg border shadow-sm p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-500 mb-2">Error</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadSubscriptions}>
              Try Again
            </Button>
          </div>
        </div>
      </motion.div>
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
                <h1 className="text-3xl font-bold tracking-tight">My Subscriptions</h1>
                <Badge variant="outline" className="text-sm">
                  {filteredAndSortedSubscriptions.length} of {totalCount}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Manage and track your active subscriptions
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={normalizedStatusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value, 10))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 per page</SelectItem>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="18">18 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
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
              variant={sortBy === 'expiration_date' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('expiration_date')}
              className="text-xs"
            >
              Expires {sortBy === 'expiration_date' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
            <Button
              variant={sortBy === 'time_remaining' ? 'default' : 'outline'}
              size="sm"
              onClick={() => toggleSort('time_remaining')}
              className="text-xs"
            >
              Time Left {sortBy === 'time_remaining' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />)}
            </Button>
          </div>
        </div>

        {/* Subscriptions Display */}
        {paginatedSubscriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {subscriptions.length === 0 ? (
              <>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-4 mb-4">
                  <Clock className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No subscriptions found</h3>
                <p className="text-muted-foreground max-w-md">
                  You don't have any subscriptions at the moment. Browse offers to activate a new subscription.
                </p>
              </>
            ) : (
              <>
                <div className="text-muted-foreground mb-2">No subscriptions match your filters</div>
                <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
              </>
            )}
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
              {paginatedSubscriptions.map((subscription, index) => {
                const timeRemaining = getTimeRemaining(subscription.expiration_date);

                return (
                  <motion.div
                    key={subscription.id}
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
                            <h3 className="font-semibold text-lg mb-1 line-clamp-1">{subscription.offer_details.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{subscription.offer_details.description}</p>
                          </div>
                          <div className="ml-2">
                            {getStatusBadge(subscription)}
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <DollarSign className="h-4 w-4 mr-1" />
                              Price
                            </div>
                            <span className="font-bold text-lg">{formatCurrency(subscription.offer_details.price)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Clock className="h-4 w-4 mr-1" />
                              Time Left
                            </div>
                            <span className={`font-medium ${timeRemaining.status === 'expired' ? 'text-red-500' : timeRemaining.status === 'expiring_soon' ? 'text-orange-500' : 'text-green-600'}`}>
                              {timeRemaining.text}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center text-muted-foreground">
                              <Calendar className="h-4 w-4 mr-1" />
                              Expires
                            </div>
                            <span className="font-medium">{formatDate(subscription.expiration_date)}</span>
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground">
                          Activated: {formatDate(subscription.activation_date)}
                        </div>
                      </div>
                    ) : (
                      // List View
                      <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                              <h3 className="font-semibold text-lg">{subscription.offer_details.name}</h3>
                              {getStatusBadge(subscription)}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{subscription.offer_details.description}</p>
                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <DollarSign className="h-4 w-4 mr-1" />
                                <span className="font-bold text-lg text-foreground">{formatCurrency(subscription.offer_details.price)}</span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                <span className={timeRemaining.status === 'expired' ? 'text-red-500' : timeRemaining.status === 'expiring_soon' ? 'text-orange-500' : 'text-green-600'}>
                                  {timeRemaining.text} left
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                                <span>Expires {formatDate(subscription.expiration_date)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-xs text-muted-foreground">
                              Activated: {formatDate(subscription.activation_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Pagination - Always show if there are subscriptions */}
            {filteredAndSortedSubscriptions.length > 0 && (
              <div className="flex justify-between items-center mt-8 bg-white rounded-lg border p-4">
                <div className="text-sm text-muted-foreground">
                  Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedSubscriptions.length)} of {filteredAndSortedSubscriptions.length} subscriptions
                  {filteredAndSortedSubscriptions.length !== totalCount && (
                    <span className="ml-1">(filtered from {totalCount} total)</span>
                  )}
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
      </motion.div>
    </div>
  );
};

export default SubscriptionsPage;