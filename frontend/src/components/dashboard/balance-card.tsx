import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/services/auth-context';
import { Wallet } from 'lucide-react';

const BalanceCard: React.FC = () => {
  const { user } = useAuth();

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Account Balance</CardTitle>
        <Wallet className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {user?.account ? formatCurrency(user.account.balance) : 'N/A'}
        </div>
        <p className="text-xs text-muted-foreground">
          Your current account balance
        </p>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;