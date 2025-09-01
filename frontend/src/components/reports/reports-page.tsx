import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Loader2, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Calendar,
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { Sidebar } from '../dashboard/sidebar';
import { useSidebar } from '../dashboard/sidebar-context';
import { reportsApi, type ExportFormat } from '@/services/reports';
import { transactionsApi } from '@/services/transactions';
import type { Transaction } from '@/services/transactions';
import toast from 'react-hot-toast';
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { DateRangePicker } from 'react-date-range';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css';

const ReportsPage: React.FC = () => {
  const [state, setState] = useState<any>([
    {
      startDate: subDays(new Date(), 30),
      endDate: new Date(),
      key: 'selection'
    }
  ]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [loading, setLoading] = useState<boolean>(false);
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Get sidebar state
  const { isCollapsed } = useSidebar();

  // Load transaction statistics
  useEffect(() => {
    loadTransactionStats();
  }, []);

  const loadTransactionStats = async () => {
    try {
      setStatsLoading(true);
      const data = await transactionsApi.getTransactions(1, 100, 'ALL');
      setTransactions(data.results);
    } catch (error) {
      console.error('Error loading transaction stats:', error);
      toast.error('Failed to load transaction statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  // Calculate statistics
  const stats = React.useMemo(() => {
    const totalTransactions = transactions.length;
    const totalAmount = transactions
      .map(t => typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount)
      .filter(amount => !isNaN(amount))
      .reduce((sum, amount) => sum + amount, 0);

    const successfulTransactions = transactions.filter(t => t.status === 'SUCCESS').length;
    const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length;
    const failedTransactions = transactions.filter(t => t.status === 'FAILED').length;
    const processingTransactions = transactions.filter(t => t.status === 'PROCESSING').length;

    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;

    // Recent transactions (last 7 days)
    const sevenDaysAgo = subDays(new Date(), 7);
    const recentTransactions = transactions.filter(t => new Date(t.created_at) >= sevenDaysAgo);

    // This month vs last month
    const thisMonthStart = startOfMonth(new Date());
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

    const thisMonthTransactions = transactions.filter(t => new Date(t.created_at) >= thisMonthStart);
    const lastMonthTransactions = transactions.filter(t => {
      const date = new Date(t.created_at);
      return date >= lastMonthStart && date <= lastMonthEnd;
    });

    const monthlyGrowth = lastMonthTransactions.length > 0 
      ? ((thisMonthTransactions.length - lastMonthTransactions.length) / lastMonthTransactions.length) * 100 
      : 0;

    return {
      totalTransactions,
      totalAmount,
      successfulTransactions,
      pendingTransactions,
      failedTransactions,
      processingTransactions,
      successRate,
      recentTransactions: recentTransactions.length,
      monthlyGrowth
    };
  }, [transactions]);

  const quickDateRanges = [
    {
      label: 'Last 7 days',
      range: {
        startDate: subDays(new Date(), 7),
        endDate: new Date(),
        key: 'selection'
      }
    },
    {
      label: 'Last 30 days',
      range: {
        startDate: subDays(new Date(), 30),
        endDate: new Date(),
        key: 'selection'
      }
    },
    {
      label: 'This month',
      range: {
        startDate: startOfMonth(new Date()),
        endDate: new Date(),
        key: 'selection'
      }
    },
    {
      label: 'Last month',
      range: {
        startDate: startOfMonth(subMonths(new Date(), 1)),
        endDate: endOfMonth(subMonths(new Date(), 1)),
        key: 'selection'
      }
    }
  ];

  const handleExport = async () => {
    if (!state[0].startDate || !state[0].endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (state[0].startDate > state[0].endDate) {
      toast.error("Start date must be before end date");
      return;
    }

    try {
      setLoading(true);

      // Export transactions
      await reportsApi.exportTransactions(
        {
          startDate: format(state[0].startDate, "yyyy-MM-dd"),
          endDate: format(state[0].endDate, "yyyy-MM-dd")
        },
        exportFormat
      );

      toast.success(`Transactions exported as ${exportFormat.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export transactions");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`flex-1 flex flex-col transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
                <Badge variant="outline" className="text-sm">
                  <BarChart3 className="h-3 w-3 mr-1" />
                  Dashboard
                </Badge>
              </div>
              <p className="text-muted-foreground">
                View transaction statistics and export data in various formats
              </p>
            </div>
            <Button variant="outline" onClick={loadTransactionStats} disabled={statsLoading}>
              <Activity className={`h-4 w-4 mr-2 ${statsLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : stats.totalTransactions.toLocaleString()}</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">
                    {statsLoading ? '...' : `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`}
                  </span>
                  <span className="text-muted-foreground ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : formatCurrency(stats.totalAmount)}</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-muted-foreground">Average: </span>
                  <span className="font-medium ml-1">
                    {statsLoading ? '...' : formatCurrency(stats.totalTransactions > 0 ? stats.totalAmount / stats.totalTransactions : 0)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Success Rate</p>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : `${stats.successRate.toFixed(1)}%`}</p>
                  </div>
                  <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-emerald-600 font-medium">
                    {statsLoading ? '...' : stats.successfulTransactions}
                  </span>
                  <span className="text-muted-foreground ml-1">successful transactions</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Recent Activity</p>
                    <p className="text-2xl font-bold">{statsLoading ? '...' : stats.recentTransactions}</p>
                  </div>
                  <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className="text-muted-foreground">Last 7 days</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Status Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Transaction Status Breakdown
              </CardTitle>
              <CardDescription>Distribution of transaction statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Success</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {statsLoading ? '...' : stats.successfulTransactions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {statsLoading ? '...' : `${stats.successRate.toFixed(1)}%`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Pending</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-600">
                      {statsLoading ? '...' : stats.pendingTransactions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {statsLoading ? '...' : `${stats.totalTransactions > 0 ? ((stats.pendingTransactions / stats.totalTransactions) * 100).toFixed(1) : 0}%`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Processing</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-blue-600">
                      {statsLoading ? '...' : stats.processingTransactions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {statsLoading ? '...' : `${stats.totalTransactions > 0 ? ((stats.processingTransactions / stats.totalTransactions) * 100).toFixed(1) : 0}%`}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Failed</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {statsLoading ? '...' : stats.failedTransactions}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {statsLoading ? '...' : `${stats.totalTransactions > 0 ? ((stats.failedTransactions / stats.totalTransactions) * 100).toFixed(1) : 0}%`}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Data
              </CardTitle>
              <CardDescription>
                Export transaction data in various formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick Date Range Buttons */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Quick Date Ranges</Label>
                <div className="grid grid-cols-2 gap-2">
                  {quickDateRanges.map((range, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setState([range.range])}
                      className="text-xs"
                    >
                      {range.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div className="space-y-2">
                <Label htmlFor="date-range">Custom Date Range</Label>
                <div className="relative">
                  <Button
                    id="date-range"
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {state[0].startDate ? (
                      state[0].endDate ? (
                        <>
                          {format(state[0].startDate, "MMM dd, y")} - {format(state[0].endDate, "MMM dd, y")}
                        </>
                      ) : (
                        format(state[0].startDate, "MMM dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                  {showDatePicker && (
                    <div className="absolute z-10 mt-2 p-4 bg-white border rounded-lg shadow-lg right-0">
                      <DateRangePicker
                        onChange={item => setState([item.selection])}
                        showSelectionPreview={true}
                        moveRangeOnFirstSelection={false}
                        months={2}
                        ranges={state}
                        direction="horizontal"
                      />
                      <Button
                        className="mt-2 w-full"
                        onClick={() => setShowDatePicker(false)}
                      >
                        Apply Range
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Export Format */}
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-green-600" />
                        CSV
                      </div>
                    </SelectItem>
                    <SelectItem value="pdf">
                      <div className="flex items-center gap-2">
                        <FileImage className="h-4 w-4 text-red-600" />
                        PDF
                      </div>
                    </SelectItem>
                    <SelectItem value="xlsx">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Excel (XLSX)
                      </div>
                    </SelectItem>
                    <SelectItem value="word">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        Word
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleExport}
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Data
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Export Format Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Export Format Guide
            </CardTitle>
            <CardDescription>
              Choose the right format for your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="border-2 border-green-200 bg-green-50/50 rounded-lg p-4 transition-all duration-200 hover:border-green-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  <h3 className="font-medium text-green-800">CSV</h3>
                </div>
                <p className="text-sm text-green-700/80">
                  Best for data analysis and importing into spreadsheet applications like Excel or Google Sheets
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="border-2 border-red-200 bg-red-50/50 rounded-lg p-4 transition-all duration-200 hover:border-red-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileImage className="h-5 w-5 text-red-600" />
                  <h3 className="font-medium text-red-800">PDF</h3>
                </div>
                <p className="text-sm text-red-700/80">
                  Ideal for printing, sharing as documents, and creating professional reports with formatting
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="border-2 border-emerald-200 bg-emerald-50/50 rounded-lg p-4 transition-all duration-200 hover:border-emerald-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                  <h3 className="font-medium text-emerald-800">Excel (XLSX)</h3>
                </div>
                <p className="text-sm text-emerald-700/80">
                  Perfect for complex data manipulation, calculations, and advanced Excel features
                </p>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.02 }}
                className="border-2 border-blue-200 bg-blue-50/50 rounded-lg p-4 transition-all duration-200 hover:border-blue-300 hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <h3 className="font-medium text-blue-800">Word</h3>
                </div>
                <p className="text-sm text-blue-700/80">
                  Suitable for creating reports, documentation, and text-based analysis
                </p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default ReportsPage;