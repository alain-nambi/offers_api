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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt'
  });

  // Set document properties
  doc.setProperties({
    title: 'Transactions Report',
    subject: 'Transaction History',
    author: 'Offer Manager',
    keywords: 'transactions, report, export',
    creator: 'Offer Manager System'
  });

  // Page dimensions
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header with company branding
  doc.setFillColor(249, 250, 251); // gray-50
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  // Company icon simulation (in a real app, this would be an actual logo)
  doc.setFillColor(59, 130, 246); // blue-500 for the icon
  doc.circle(50, 50, 15, 'F');
  doc.setFillColor(255, 255, 255);
  doc.circle(50, 50, 8, 'F');
  doc.setFillColor(59, 130, 246); // blue-500
  doc.circle(50, 50, 5, 'F');
  
  // Company name and report title
  doc.setTextColor(17, 24, 39); // gray-900
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text('Offer Manager', 75, 45);
  
  doc.setFontSize(14);
  doc.setFont(undefined, 'normal');
  doc.text('Transaction Report', 75, 65);
  
  // Report info section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Date range
  doc.setFont(undefined, 'bold');
  doc.text('Report Period:', 40, 130);
  doc.setFont(undefined, 'normal');
  doc.text(`${dateRange.startDate} to ${dateRange.endDate}`, 120, 130);
  
  // Generation info
  const generationDate = new Date().toLocaleDateString();
  const generationTime = new Date().toLocaleTimeString();
  doc.setFont(undefined, 'bold');
  doc.text('Generated On:', 40, 145);
  doc.setFont(undefined, 'normal');
  doc.text(`${generationDate} at ${generationTime}`, 120, 145);
  
  // Summary statistics in a styled box
  const totalAmount = transactions
    .map(t => typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount)
    .filter(amount => !isNaN(amount))
    .reduce((sum, amount) => sum + amount, 0);

  const successfulTransactions = transactions.filter(t => t.status === 'SUCCESS').length;
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING').length;
  const failedTransactions = transactions.filter(t => t.status === 'FAILED').length;
  
  // Draw summary container
  doc.setFillColor(243, 244, 246); // gray-100
  doc.roundedRect(30, 170, pageWidth - 60, 100, 5, 5, 'F');
  doc.setDrawColor(229, 231, 235); // gray-200
  doc.setLineWidth(0.5);
  doc.roundedRect(30, 170, pageWidth - 60, 100, 5, 5, 'S');
  
  // Summary title
  doc.setTextColor(17, 24, 39); // gray-900
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('Report Summary', 45, 190);
  
  // Summary details
  doc.setFontSize(10);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`Total Transactions: ${transactions.length}`, 45, 215);
  doc.text(`Total Amount: $${totalAmount.toFixed(2)}`, 45, 235);
  
  // Status breakdown with colored text
  doc.setFont(undefined, 'bold');
  doc.text('Status Breakdown:', 250, 215);
  
  doc.setTextColor(5, 150, 105); // green-600
  doc.text(`Success: ${successfulTransactions}`, 250, 235);
  
  doc.setTextColor(217, 119, 6); // orange-600
  doc.text(`Pending: ${pendingTransactions}`, 350, 235);
  
  doc.setTextColor(220, 38, 38); // red-600
  doc.text(`Failed: ${failedTransactions}`, 450, 235);
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Add transactions table
  autoTable(doc, {
    startY: 290,
    head: [['ID', 'Transaction ID', 'User', 'Offer', 'Amount', 'Status', 'Created']],
    body: transactions.map(transaction => [
      transaction.id,
      transaction.transaction_id, // Full transaction ID
      transaction.user,
      transaction.offer,
      `$${typeof transaction.amount === 'string' ? parseFloat(transaction.amount).toFixed(2) : transaction.amount.toFixed(2)}`,
      transaction.status,
      new Date(transaction.created_at).toLocaleDateString()
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 6
    },
    headStyles: {
      fillColor: [209, 213, 219], // gray-300
      textColor: [17, 24, 39], // gray-900
      fontStyle: 'bold',
      cellPadding: 8
    },
    bodyStyles: {
      cellPadding: 6
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251] // gray-50
    },
    // Add status-specific styling
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 5) { // Status column
        if (data.cell.raw === 'SUCCESS') {
          data.cell.styles.textColor = [5, 150, 105]; // green-600
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'FAILED') {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'PENDING') {
          data.cell.styles.textColor = [217, 119, 6]; // orange-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    // Handle cell width to prevent truncation
    columnStyles: {
      0: { cellWidth: 30 },   // ID
      1: { cellWidth: 150 },  // Transaction ID (full width)
      2: { cellWidth: 50 },   // User
      3: { cellWidth: 70 },   // Offer
      4: { cellWidth: 60 },   // Amount
      5: { cellWidth: 60 },   // Status
      6: { cellWidth: 70 }    // Created
    },
    // Page footer
    didDrawPage: function (data) {
      // Footer
      const pageCount = doc.internal.getNumberOfPages();
      const str = `Page ${data.pageNumber} of ${pageCount}`;
      
      doc.setFontSize(8);
      doc.setTextColor(156, 163, 175); // gray-400
      
      const pageSize = doc.internal.pageSize;
      const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
      doc.text(str, pageWidth - 40, pageSize.height - 20);
      
      // Add a footer line
      doc.setDrawColor(229, 231, 235); // gray-200
      doc.setLineWidth(0.5);
      doc.line(30, pageSize.height - 30, pageWidth - 30, pageSize.height - 30);
    }
  });

  return doc.output('blob');
};

// Reports API functions
export const reportsApi = {
  // Get transactions within a date range
  getTransactionsByDateRange: async (dateRange: DateRange): Promise<Transaction[]> => {
    try {
      // Fetch all transactions - we need to handle pagination to get all data
      let allTransactions: Transaction[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await api.get(`/account/transactions/?page=${page}&page_size=100`);

        // Handle both paginated response and array response for backward compatibility
        if (Array.isArray(response.data)) {
          // Legacy array response
          allTransactions = [...allTransactions, ...response.data];
          hasMore = false;
        } else {
          // Paginated response
          allTransactions = [...allTransactions, ...response.data.results];
          hasMore = response.data.next !== null;
          page++;
        }
      }

      // Filter transactions by date range
      const filteredTransactions = allTransactions.filter(transaction => {
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