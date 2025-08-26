import React from 'react';

// UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Hooks & Services
import { useAuth } from '@/services/auth-context';

// Icons
import { Wallet } from 'lucide-react';

/**
 * BalanceCard Component
 *
 * Displays the user's current account balance in a clean card layout.
 * Automatically updates when the user or their account balance changes.
 *
 * Features:
 * - Currency formatting (USD)
 * - Fallback to 'N/A' if no account exists
 * - Responsive design with icon
 *
 * Uses:
 * - `useAuth()` to access authenticated user data
 * - `Intl.NumberFormat` for localized currency display
 */
const BalanceCard: React.FC = () => {
  // Get the authenticated user from context
  const { user } = useAuth();

  // Extract balance safely with fallback to 0
  const balance = user?.account?.balance ?? 0;

  /**
   * Format the balance as USD currency
   * Example: 1234.56 → $1,234.56
   *
   * @param amount - The numeric amount to format
   * @returns Formatted currency string
   */
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-800">
          Account Balance
        </CardTitle>
        <Wallet className="h-4 w-4 text-gray-500" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {user?.account ? formatCurrency(balance) : 'N/A'}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Your current account balance
        </p>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;