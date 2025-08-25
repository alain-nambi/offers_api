import React, { useState, useEffect } from 'react';
import OfferActivation from '@/components/offers/offer-activation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const OffersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Add a 250ms delay for smoother page transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading offers..." />;
  }

  return (
    <div className="container mx-auto animate-in fade-in duration-300">
      <OfferActivation />
    </div>
  );
};

export default OffersPage;