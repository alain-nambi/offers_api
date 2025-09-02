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
import { useSidebar } from '../dashboard/sidebar-context';
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

  // Get sidebar state
  const { isCollapsed } = useSidebar();

  return (
    <div className="flex h-screen bg-gray-50">
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
              <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
              <Badge variant="outline" className="text-xs">
                {filteredAndSortedTransactions.length} of {totalCount}
              </Badge>
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
        </div>

        {/* Search and Filters - Compacted */}
        <div className="bg-white border-b px-6 py-3">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 py-1 text-sm"
              />
            </div>

            <Select value={statusFilter} onValueChange={(value: string) => setStatusFilter(value)}>
              <SelectTrigger className="w-[140px] py-1 text-sm">
                <Filter className="h-4 w-4 mr-1" />
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
              <SelectTrigger className="w-[100px] py-1 text-sm">
                <SelectValue placeholder="Items" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 items</SelectItem>
                <SelectItem value="10">10 items</SelectItem>
                <SelectItem value="15">15 items</SelectItem>
                <SelectItem value="25">25 items</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto p-6">
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
              <div className="rounded-lg border bg-white">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('id')}
                          className="px-0 font-bold"
                        >
                          ID
                          {sortBy === 'id' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('transaction_id')}
                          className="px-0 font-bold"
                        >
                          Transaction ID
                          {sortBy === 'transaction_id' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('offer_name')}
                          className="px-0 font-bold"
                        >
                          Offer
                          {sortBy === 'offer_name' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('amount')}
                          className="px-0 font-bold"
                        >
                          Amount
                          {sortBy === 'amount' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('status')}
                          className="px-0 font-bold"
                        >
                          Status
                          {sortBy === 'status' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('created_at')}
                          className="px-0 font-bold"
                        >
                          Created
                          {sortBy === 'created_at' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead>
                        <Button
                          variant="ghost"
                          onClick={() => toggleSort('completed_at')}
                          className="px-0 font-bold"
                        >
                          Completed
                          {sortBy === 'completed_at' && (sortDirection === 'asc' ? <SortAsc className="ml-1 h-4 w-4" /> : <SortDesc className="ml-1 h-4 w-4" />)}
                        </Button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-medium">{transaction.id}</TableCell>
                        <TableCell className="font-mono text-sm">{transaction.transaction_id}</TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.offer_details?.name || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{transaction.offer_details?.description || ''}</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          <div className="flex items-center justify-end">
                            <DollarSign className="h-4 w-4 mr-1" />
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                        <TableCell>{new Date(transaction.created_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {transaction.completed_at
                            ? new Date(transaction.completed_at).toLocaleDateString()
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-6 bg-white rounded-lg border p-4">
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
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default TransactionsList;