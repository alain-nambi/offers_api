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
  
  // Set document properties
  doc.setProperties({
    title: 'Transactions Report',
    subject: 'Transaction History',
    author: 'Offer Manager',
    keywords: 'transactions, report, export',
    creator: 'Offer Manager System'
  });
  
  // Add header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text('Transactions Report', 14, 15);
  
  // Add date range and generation info
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, 14, 22);
  
  const generationDate = new Date().toLocaleDateString();
  const generationTime = new Date().toLocaleTimeString();
  doc.text(`Generated: ${generationDate} at ${generationTime}`, 14, 28);
  
  // Add summary statistics
  const totalAmount = transactions
    .map(t => typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount)
    .filter(amount => !isNaN(amount))
    .reduce((sum, amount) => sum + amount, 0);
    
  const successfulTransactions = transactions.filter(t => t.status === 'SUCCESS').length;
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length;
  const failedTransactions = transactions.filter(t => t.status === 'FAILED').length;
  
  // Summary in a compact format
  doc.setFontSize(10);
  doc.text(
    `Summary: ${transactions.length} transactions | ` +
    `Success: ${successfulTransactions} | ` +
    `Pending: ${pendingTransactions} | ` +
    `Failed: ${failedTransactions} | ` +
    `Total: $${totalAmount.toFixed(2)}`,
    14,
    35
  );
  
  // Add transactions table
  autoTable(doc, {
    startY: 40,
    head: [['ID', 'Transaction ID', 'User', 'Offer', 'Amount', 'Status', 'Created']],
    body: transactions.map(transaction => [
      transaction.id,
      transaction.transaction_id, // Show full transaction ID
      transaction.user,
      transaction.offer,
      `$${typeof transaction.amount === 'string' ? parseFloat(transaction.amount).toFixed(2) : transaction.amount.toFixed(2)}`,
      transaction.status,
      new Date(transaction.created_at).toLocaleDateString()
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 2
    },
    headStyles: {
      fillColor: [59, 130, 246], // blue-500
      textColor: [255, 255, 255], // white
      fontStyle: 'bold'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // light gray
    },
    // Add status-specific styling
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) { // Status column
        if (data.cell.raw === 'SUCCESS') {
          data.cell.styles.textColor = [0, 128, 0]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'FAILED') {
          data.cell.styles.textColor = [255, 0, 0]; // Red
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'PENDING') {
          data.cell.styles.textColor = [255, 165, 0]; // Orange
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    // Handle cell width to prevent truncation
    columnStyles: {
      0: { cellWidth: 15 },  // ID
      1: { cellWidth: 40 },  // Transaction ID (full width)
      2: { cellWidth: 15 },  // User
      3: { cellWidth: 15 },  // Offer
      4: { cellWidth: 25 },  // Amount
      5: { cellWidth: 20 },  // Status
      6: { cellWidth: 25 }   // Created
    }
  });
  
  // Add page numbers
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Page ${i} of ${pageCount}`, 195, 285, null, null, 'right');
  }
  
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