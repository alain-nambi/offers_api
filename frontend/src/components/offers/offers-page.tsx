import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import OfferActivation from '@/components/offers/offer-activation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const OffersPage: React.FC = () => {
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   // Add a 250ms delay for smoother page transition
  //   const timer = setTimeout(() => {
  //     setLoading(false);
  //   }, 250);

  //   return () => clearTimeout(timer);
  // }, []);

  // if (loading) {
  //   return <LoadingSpinner fullScreen message="Loading offers..." />;
  // }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto"
    >
      <OfferActivation />
    </motion.div>
  );
};

export default OffersPage;