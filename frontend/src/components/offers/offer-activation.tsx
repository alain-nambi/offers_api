import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/services/auth-context';
import { offersApi } from '@/services/offers';
import type { Offer, PaginatedResponse } from '@/services/offers';
import { toast } from 'react-hot-toast';
import {
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Calendar,
  Loader2
} from 'lucide-react';

import { Sidebar } from '../dashboard/sidebar';
import { authApi } from '@/services/auth';

// Helper function to format price
const formatPrice = (price: number | string): string => {
  const priceNum = typeof price === 'number' ? price : parseFloat(price) || 0;
  return priceNum.toFixed(2);
};

const OfferActivation: React.FC = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<number | null>(null);
  const [activationStatus, setActivationStatus] = useState<Record<string, any>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const { user, setUser } = useAuth();

  // Load offers on component mount and when page changes
  useEffect(() => {
    loadOffers();
  }, [currentPage]);

  // Load all available offers
  const loadOffers = async () => {
    try {
      setLoading(true);
      const data: PaginatedResponse<Offer> = await offersApi.listOffers(currentPage, 5);
      setOffers(data.results);
      setTotalPages(Math.ceil(data.count / 5));
      setTotalCount(data.count);
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

      // Update activation status
      setActivationStatus(prev => ({
        ...prev,
        [response.transaction_id]: 'PENDING'
      }));

      toast.success('Activation started! Check status in transactions.');

      // Refresh user data to update balance
      const userData = await authApi.profile();
      setUser(userData);

      // Poll for activation status
      pollActivationStatus(response.transaction_id);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to activate offer');
      console.error('Error activating offer:', error);
    } finally {
      setActivating(null);
    }
  };

  // Poll for activation status updates
  const pollActivationStatus = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await offersApi.getActivationStatus(transactionId);
        setActivationStatus(prev => ({
          ...prev,
          [transactionId]: status.status
        }));

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
    }, 3000);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (loading && currentPage === 1) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-muted-foreground">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="flex-1 flex flex-col p-6 space-y-6 ml-64"
      >
        <div className="flex justify-between items-center mb-8 fixed top-0 left-64 right-0 bg-white p-4 shadow z-10">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Available Offers</h1>
            <p className="text-muted-foreground">
              Browse and activate available offers
            </p>
          </div>
          <div className='flex gap-2 items-center'>
            Your current balance :
            <Badge variant={"outline"} className='text-sm'>
              {user?.account?.balance ? user.account.balance : 'N/A'} $
            </Badge>
            <Badge variant="outline" className="text-sm">
              {totalCount} Offer{totalCount !== 1 ? 's' : ''}
            </Badge>
          </div>

        </div>

        {loading ? (
          <div className="flex justify-center items-center flex-1">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <motion.div
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-20"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.3 }}
            >
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.3 }}
                >
                  <Card className="h-full flex flex-col">
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
                          <span className="font-bold text-lg">${formatPrice(offer.price)}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-medium">{offer.duration_days} days</span>
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>Created: {new Date(offer.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full"
                        onClick={() => activateOffer(offer.id)}
                        disabled={!offer.is_active || activating === offer.id || !user || user.balance < Number(offer.price)}
                      >
                        {activating === offer.id ? (
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
                    </CardFooter>

                    {!offer.is_active && (
                      <div className="px-6 pb-4">
                        <Badge variant="outline" className="w-full justify-center">
                          <AlertCircle className="mr-1 h-3 w-3" />
                          This offer is currently inactive
                        </Badge>
                      </div>
                    )}
                  </Card>
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4 mt-8">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                >
                  Previous
                </Button>

                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
};

export default OfferActivation;