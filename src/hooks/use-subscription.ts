'use client';

import { useState, useEffect } from 'react';

interface SubscriptionDetails {
  subscription_status: string;
  subscription_end_date: string;
}

export const useSubscription = (userDetails: SubscriptionDetails | null) => {
  const [isPro, setIsPro] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isSubscriptionExpiringSoon, setIsSubscriptionExpiringSoon] = useState(false);

  useEffect(() => {
    if (userDetails) {
      const isProUser = userDetails.subscription_status === 'active';
      setIsPro(isProUser);

      const subscriptionEndDate = userDetails.subscription_end_date ? new Date(userDetails.subscription_end_date) : null;
      const now = new Date();

      setIsSubscriptionExpired(false);
      setIsSubscriptionExpiringSoon(false);

      if (subscriptionEndDate && subscriptionEndDate < now) {
        setIsSubscriptionExpired(true);
      } else if (subscriptionEndDate) {
        const daysRemaining = (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysRemaining <= 7) {
          setIsSubscriptionExpiringSoon(true);
        }
      }
    }
  }, [userDetails]);

  return { isPro, isSubscriptionExpired, isSubscriptionExpiringSoon };
};