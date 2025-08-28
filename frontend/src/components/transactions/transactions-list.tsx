import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Loader2,
  RefreshCw,
  Search,
  SortAsc,
  SortDesc,
  Filter,
  Download,
  Eye,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign
} from 'lucide-react';
import { Sidebar } from '../dashboard/sidebar';
import { transactionsApi } from '@/services/transactions';
import type { Transaction, PaginatedResponse } from '@/services/transactions';
import { useUrlPagination } from '@/hooks/useUrlPagination';

type SortOption = 'id' | 'transaction_id' | 'offer_name' | 'amount' | 'status' | 'created_at' | 'completed_at';
type SortDirection = 'asc' | 'desc';

const TransactionsList: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Use URL-based pagination with status filter
  const {
    currentPage,
    pageSize,
    statusFilter,
    setCurrentPage,
    setPageSize,
    setStatusFilter
  } = useUrlPagination({
    defaultPage: 1,
    defaultPageSize: 5,
    defaultStatus: 'ALL'
  });

  // Load transactions when pagination parameters change
  useEffect(() => {
    loadTransactions();
  }, [currentPage, pageSize]);

  // Reset to first page when search or filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchQuery, sortBy, sortDirection]);

  // Filter and sort transactions
  const filteredAndSortedTransactions = useMemo(() => {
    let filtered = transactions.filter(transaction => {
      const matchesSearch =
        transaction.transaction_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.offer_details?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (transaction.offer_details?.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        transaction.id.toString().includes(searchQuery);

      const matchesStatus = statusFilter === 'ALL' || transaction.status === statusFilter;

      return matchesSearch && matchesStatus;
    });

    // Sort transactions
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
          break;
        case 'transaction_id':
          aValue = a.transaction_id.toLowerCase();
          bValue = b.transaction_id.toLowerCase();
          break;
        case 'offer_name':
          aValue = (a.offer_details?.name || '').toLowerCase();
          bValue = (b.offer_details?.name || '').toLowerCase();
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'completed_at':
          aValue = a.completed_at ? new Date(a.completed_at) : new Date(0);
          bValue = b.completed_at ? new Date(b.completed_at) : new Date(0);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [transactions, searchQuery, sortBy, sortDirection, statusFilter]);

  // Paginate filtered results
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedTransactions.slice(startIndex, endIndex);
  }, [filteredAndSortedTransactions, currentPage, pageSize]);

  const totalFilteredPages = Math.ceil(filteredAndSortedTransactions.length / pageSize);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load more items to enable client-side filtering and sorting
      const data: PaginatedResponse<Transaction> = await transactionsApi.getTransactions(1, 100, 'ALL');

      if (data) {
        setTransactions(data.results);
        setTotalCount(data.count);
      }
    } catch (err: any) {
      setError('Failed to load transactions. Please try again later.');
      console.error('Error loading transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalFilteredPages) {
      setCurrentPage(page);
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Success
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      case 'PROCESSING':
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Processing
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };



  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // if (loading) {
  //   return (
  //     <div className="flex justify-center items-center h-64">
  //       <div className="flex flex-col items-center">
  //         <Loader2 className="h-8 w-8 animate-spin text-primary" />
  //         <p className="mt-2 text-muted-foreground">Loading transactions...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="flex h-screen bg-gray-50">
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
                <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
                <Badge variant="outline" className="text-sm">
                  {filteredAndSortedTransactions.length} of {totalCount}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                View and track your transaction history
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={loadTransactions} disabled={loading}>
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
              <SelectTrigger className="w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value, 10))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Items per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 per page</SelectItem>
                <SelectItem value="10">10 per page</SelectItem>
                <SelectItem value="15">15 per page</SelectItem>
                <SelectItem value="25">25 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>


        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {error ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-500 mb-2">Error loading transactions</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={loadTransactions}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          ) : paginatedTransactions.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                {transactions.length === 0 ? (
                  <>
                    <div className="bg-gray-100 rounded-full p-4 mx-auto mb-4 w-fit">
                      <Eye className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No transactions found</h3>
                    <p className="text-gray-600 max-w-md">
                      You haven't made any transactions yet. Start by activating an offer!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-gray-600 mb-2">No transactions match your filters</div>
                    <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
                  </>
                )}
              </div>
            </div>
          ) : (
            <>
              {/* Transactions Table */}
              <motion.div 
                className="bg-white rounded-lg border shadow-sm overflow-hidden"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b bg-muted/30">
                      <TableHead className="font-semibold text-foreground w-20">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('id')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          ID
                          {sortBy === 'id' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-64">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('transaction_id')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          Transaction ID
                          {sortBy === 'transaction_id' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('offer_name')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          Offer Details
                          {sortBy === 'offer_name' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground text-right w-32">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('amount')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-right justify-end w-full"
                        >
                          Amount
                          {sortBy === 'amount' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-28">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('status')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          Status
                          {sortBy === 'status' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-36">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('created_at')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          Created
                          {sortBy === 'created_at' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-foreground w-36">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSort('completed_at')}
                          className="h-auto p-0 font-semibold hover:bg-transparent text-left justify-start"
                        >
                          Completed
                          {sortBy === 'completed_at' && (
                            sortDirection === 'asc' ? <SortAsc className="ml-1 h-3 w-3" /> : <SortDesc className="ml-1 h-3 w-3" />
                          )}
                        </Button>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction, index) => (
                      <TableRow
                        key={transaction.id}
                        className={`hover:bg-muted/50 transition-colors border-b ${index % 2 === 0 ? 'bg-white' : 'bg-muted/20'
                          }`}
                      >
                        <TableCell className="font-medium py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                            <span className="font-mono text-sm font-semibold">#{transaction.id}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="font-mono text-xs bg-muted px-3 py-2 rounded-lg inline-block border max-w-full">
                            <span className="block truncate" title={transaction.transaction_id}>
                              {transaction.transaction_id}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1 max-w-xs">
                            <div className="font-semibold text-sm text-foreground">
                              {transaction.offer_details?.name || `Offer #${transaction.offer}`}
                            </div>
                            {transaction.offer_details?.description && (
                              <div className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {transaction.offer_details.description}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right py-4">
                          <div className="inline-flex items-center bg-green-50 text-green-800 px-3 py-1.5 rounded-lg font-bold text-sm border border-green-200">
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            <div className="text-sm font-medium text-foreground">
                              {new Date(transaction.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(transaction.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1">
                            {transaction.completed_at ? (
                              <>
                                <div className="text-sm font-medium text-foreground">
                                  {new Date(transaction.completed_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {new Date(transaction.completed_at).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm text-muted-foreground italic font-medium">Pending</div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </motion.div>

              {/* Pagination - Always show if there are transactions */}
              {filteredAndSortedTransactions.length > 0 && (
                <div className="flex justify-between items-center mt-8 bg-white rounded-lg border p-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredAndSortedTransactions.length)} of {filteredAndSortedTransactions.length} transactions
                    {filteredAndSortedTransactions.length !== totalCount && (
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
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionsList;