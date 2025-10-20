'use client';

import React, { createContext, useContext, ReactNode } from 'react';
// We still use the original hook, but only inside this provider
import { useUser as useOriginalUser } from '@/hooks/use-user'; 
import { User } from '@supabase/supabase-js';

// Define the shape of the data that our context will provide
interface UserContextType {
  user: User | null | undefined;
  libraryId: string | undefined;
  isUserLoading: boolean;
  isPro: boolean;
  isStudentLimitReached: boolean;
  isSubscriptionExpired: boolean;
  refreshUserData: () => void;
}

// Create the context. It will be undefined for components outside the provider.
const UserContext = createContext<UserContextType | undefined>(undefined);

// The Provider component itself
export const UserProvider = ({ children }: { children: ReactNode }) => {
  // --- This is now the ONLY place in the dashboard that calls the original hook ---
  const userData = useOriginalUser();

  // The value is memoized to prevent unnecessary re-renders in consumer components
  const value = React.useMemo(() => ({
    user: userData.user,
    libraryId: userData.libraryId,
    isUserLoading: userData.isLoading,
    isPro: userData.isPro,
    isStudentLimitReached: userData.isStudentLimitReached,
    isSubscriptionExpired: userData.isSubscriptionExpired,
    refreshUserData: userData.refresh,
  }), [userData]);

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// A custom hook for easy consumption of our new context
// Components will use this instead of the original `useUser`
export const useSharedUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useSharedUser must be used within a UserProvider');
  }
  return context;
};
