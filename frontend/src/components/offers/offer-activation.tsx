import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/services/auth-context';
import { offersApi } from '@/services/offers';
import type { Offer } from '@/services/offers';
import { toast } from 'react-hot-toast';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  CreditCard, 
  Calendar, 
  Loader2 
} from 'lucide-react';

const OfferActivation: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [activationStatus, setActivationStatus] = useState<Record<string, any>>({});
  const { user } = useAuth();

  // Load offers on component mount
  useEffect(() => {
    loadOffers();
  }, []);

  // Load all available offers
  const loadOffers = async () => {
    try {
      const data = await offersApi.listOffers();
      setOffers(data);
    } catch (error) {
      toast.error('Failed to load offers');
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Activate an offer
  const activateOffer = async (offerId: number) => {
    setActivating(offerId);
    try {
      const response = await offersApi.activateOffer(offerId);
      
      // Show success message
      toast.success('Activation started successfully!');
      
      // Start polling for status
      pollActivationStatus(response.transaction_id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Failed to activate offer';
      toast.error(errorMessage);
      console.error('Error activating offer:', error);
    } finally {
      setActivating(null);
    }
  };

  // Poll for activation status
  const pollActivationStatus = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await offersApi.getActivationStatus(transactionId);
        setActivationStatus(prev => ({
          ...prev,
          [transactionId]: status
        }));

        // Stop polling if activation is complete
        if (status.status === 'SUCCESS' || status.status === 'FAILED') {
          clearInterval(interval);
          
          if (status.status === 'SUCCESS') {
            toast.success('Offer activated successfully!');
          } else {
            toast.error('Offer activation failed');
          }
        }
      } catch (error) {
        console.error('Error polling activation status:', error);
        clearInterval(interval);
      }
    }, 3000); // Poll every 3 seconds
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Available Offers</h2>
        <p className="text-muted-foreground">
          Activate offers to start using our services. Your current balance: {user?.account?.balance ? formatCurrency(user.account.balance) : 'N/A'}
        </p>
      </div>

      {offers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No offers available</h3>
            <p className="text-muted-foreground text-center">
              There are currently no offers available. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers.map((offer) => {
            const isActivating = activating === offer.id;
            const status = Object.values(activationStatus).find(
              (s: any) => s.offer_id === offer.id.toString()
            );

            return (
              <Card key={offer.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{offer.name}</CardTitle>
                      <CardDescription>{offer.description}</CardDescription>
                    </div>
                    <Badge variant={offer.is_active ? "default" : "secondary"}>
                      {offer.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Price</span>
                      <span className="font-bold text-lg">{formatCurrency(offer.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Duration</span>
                      <span className="font-medium">{offer.duration_days} days</span>
                    </div>
                    <Separator />
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>Created: {formatDate(offer.created_at)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col">
                  {status ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Status:</span>
                        <div className="flex items-center">
                          {status.status === 'PENDING' && (
                            <>
                              <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                              <span className="text-yellow-500">Processing</span>
                            </>
                          )}
                          {status.status === 'SUCCESS' && (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-green-500">Activated</span>
                            </>
                          )}
                          {status.status === 'FAILED' && (
                            <>
                              <AlertCircle className="h-4 w-4 text-red-500 mr-1" />
                              <span className="text-red-500">Failed</span>
                            </>
                          )}
                        </div>
                      </div>
                      {status.status === 'PENDING' && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Checking activation status...
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => activateOffer(offer.id)}
                      disabled={isActivating || !offer.is_active}
                    >
                      {isActivating ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Activating...
                        </>
                      ) : (
                        <>
                          <CreditCard className="mr-2 h-4 w-4" />
                          Activate Offer
                        </>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OfferActivation;