import api from './api';
import type { Transaction } from './transactions';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define the date range interface
export interface DateRange {
  startDate: string; // YYYY-MM-DD format
  endDate: string;   // YYYY-MM-DD format
}

// Define export format types
export type ExportFormat = 'pdf' | 'csv' | 'xlsx' | 'word';

// Helper function to convert transactions to CSV
const convertToCSV = (transactions: Transaction[]): string => {
  const headers = [
    'ID',
    'Transaction ID',
    'User',
    'Offer',
    'Amount',
    'Status',
    'Created At',
    'Updated At',
    'Completed At'
  ];
  
  const rows = transactions.map(transaction => [
    transaction.id,
    transaction.transaction_id,
    transaction.user,
    transaction.offer,
    transaction.amount,
    transaction.status,
    transaction.created_at,
    transaction.updated_at,
    transaction.completed_at || ''
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => `"${row.join('","')}"`)
  ].join('\n');
  
  return csvContent;
};

// Helper function to convert transactions to Excel
const convertToExcel = (transactions: Transaction[]): ArrayBuffer => {
  const worksheetData = [
    [
      'ID',
      'Transaction ID',
      'User',
      'Offer',
      'Amount',
      'Status',
      'Created At',
      'Updated At',
      'Completed At'
    ],
    ...transactions.map(transaction => [
      transaction.id,
      transaction.transaction_id,
      transaction.user,
      transaction.offer,
      transaction.amount,
      transaction.status,
      transaction.created_at,
      transaction.updated_at,
      transaction.completed_at || ''
    ])
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
  
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return wbout;
};

// Helper function to convert transactions to PDF
const convertToPDF = (transactions: Transaction[], dateRange: DateRange): Blob => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(18);
  doc.text('Transactions Report', 14, 20);
  
  // Add date range
  doc.setFontSize(12);
  doc.text(`Date Range: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 30);
  
  // Track Y position
  let currentY = 40;
  
  // Add table
  autoTable(doc, {
    startY: currentY,
    head: [['ID', 'Transaction ID', 'User', 'Offer', 'Amount', 'Status', 'Created At', 'Completed At']],
    body: transactions.map(transaction => [
      transaction.id,
      transaction.transaction_id,
      transaction.user,
      transaction.offer,
      transaction.amount,
      transaction.status,
      new Date(transaction.created_at).toLocaleDateString(),
      transaction.completed_at ? new Date(transaction.completed_at).toLocaleDateString() : 'N/A'
    ]),
    styles: {
      fontSize: 8
    },
    headStyles: {
      fillColor: [59, 130, 246] // blue-500
    },
    didDrawPage: (data) => {
      currentY = data.cursor.y + 10;
    }
  });
  
  // Add summary
  // Ensure all amounts are numbers and calculate total
  const totalAmount = transactions
    .map(t => typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount)
    .filter(amount => !isNaN(amount))
    .reduce((sum, amount) => sum + amount, 0);
    
  const successfulTransactions = transactions.filter(t => t.status === 'SUCCESS').length;
  
  doc.setFontSize(12);
  autoTable(doc, {
    startY: currentY,
    head: [['Summary']],
    body: [
      ['Total Transactions', transactions.length.toString()],
      ['Successful Transactions', successfulTransactions.toString()],
      ['Total Amount', `$${totalAmount.toFixed(2)}`]
    ],
    styles: {
      fontSize: 10
    },
    headStyles: {
      fillColor: [59, 130, 246] // blue-500
    }
  });
  
  return doc.output('blob');
};

// Reports API functions
export const reportsApi = {
  // Get transactions within a date range
  getTransactionsByDateRange: async (dateRange: DateRange): Promise<Transaction[]> => {
    try {
      // In a real implementation, this would call an API endpoint that filters by date range
      // For now, we'll fetch all transactions and filter client-side
      const response = await api.get<Transaction[]>('/account/transactions/');
      
      // Filter transactions by date range
      const filteredTransactions = response.data.filter(transaction => {
        const transactionDate = new Date(transaction.created_at);
        const startDate = new Date(dateRange.startDate);
        const endDate = new Date(dateRange.endDate);
        // Set end date to end of day
        endDate.setHours(23, 59, 59, 999);
        
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      
      return filteredTransactions;
    } catch (error) {
      console.error('Error fetching transactions by date range:', error);
      throw error;
    }
  },

  // Export transactions in various formats
  exportTransactions: async (dateRange: DateRange, format: ExportFormat): Promise<void> => {
    try {
      // Get transactions for the specified date range
      const transactions = await reportsApi.getTransactionsByDateRange(dateRange);
      
      // Handle each format
      if (format === 'csv') {
        const csvContent = convertToCSV(transactions);
        const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(csvBlob, `transactions_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
        return;
      }
      
      if (format === 'xlsx') {
        const excelBuffer = convertToExcel(transactions);
        const excelBlob = new Blob([excelBuffer], { type: 'application/octet-stream' });
        saveAs(excelBlob, `transactions_${dateRange.startDate}_to_${dateRange.endDate}.xlsx`);
        return;
      }
      
      if (format === 'pdf') {
        const pdfBlob = convertToPDF(transactions, dateRange);
        saveAs(pdfBlob, `transactions_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
        return;
      }
      
      if (format === 'word') {
        // For Word, we'll create a simple text representation
        const wordContent = `
Transactions Report
Date Range: ${dateRange.startDate} to ${dateRange.endDate}

${transactions.map(t => 
  `ID: ${t.id}
Transaction ID: ${t.transaction_id}
User: ${t.user}
Offer: ${t.offer}
Amount: ${t.amount}
Status: ${t.status}
Created: ${t.created_at}
Updated: ${t.updated_at}
Completed: ${t.completed_at || 'N/A'}
----------------------`
).join('\n')}
        `.trim();
        
        const wordBlob = new Blob([wordContent], { type: 'application/msword' });
        saveAs(wordBlob, `transactions_${dateRange.startDate}_to_${dateRange.endDate}.doc`);
        return;
      }
      
      throw new Error(`Unsupported export format: ${format}`);
    } catch (error) {
      console.error(`Error exporting transactions as ${format}:`, error);
      throw error;
    }
  }
};