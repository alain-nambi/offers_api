import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2, Download, FileText, FileSpreadsheet, File, FileImage } from 'lucide-react';
import { Sidebar } from '../dashboard/sidebar';
import { reportsApi, type ExportFormat } from '@/services/reports';
import toast from 'react-hot-toast';

const ReportsPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [loading, setLoading] = useState<boolean>(false);

  const handleExport = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date must be before end date");
      return;
    }

    try {
      setLoading(true);
      
      // Export transactions
      await reportsApi.exportTransactions(
        { startDate, endDate },
        format
      );
      
      toast.success(`Transactions exported as ${format.toUpperCase()} successfully`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error("Failed to export transactions");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col p-6 space-y-6 ml-64"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">
              Export transaction data in various formats
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Transactions</CardTitle>
              <CardDescription>
                Select a date range and format to export transaction data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="format">Export Format</Label>
                <Select value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                    <SelectItem value="word">Word</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleExport} 
                disabled={loading}
                className="w-full md:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Export Transactions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Export Options</CardTitle>
              <CardDescription>
                Different formats for different purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
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
                    Best for data analysis and importing into spreadsheet applications
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
                    Ideal for printing and sharing as a document
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
                    Best for complex data manipulation and calculations
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
                    Suitable for reports and documentation
                  </p>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportsPage;