'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useUserProfile } from './use-user-profile';
import { useLibrary } from './use-library';
import { useSubscription } from './use-subscription';
import { useStudentLimit } from './use-student-limit';
import { fetchStudentCount as originalFetchStudentCount } from '@/lib/student-count-data'; // Rename original import
import { useQuery } from '@tanstack/react-query';

export const useUser = () => {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { userDetails, isLoading: profileLoading, error: profileError, refresh: refreshUserDetails } = useUserProfile(user);
  const { libraryId, isLoading: libraryLoading, error: libraryError, refresh: refreshLibrary } = useLibrary(user);
  
  // TanStack Query for student count
  const { data: studentCount = 0, isLoading: isFetchingCount, error: studentCountError, refetch: refetchStudentCount } = useQuery({
    queryKey: ['studentCount', libraryId],
    queryFn: () => {
      if (!libraryId) {
        // If libraryId is not available, we can't fetch student count
        // Depending on desired behavior, you might throw or return a default
        return Promise.resolve(0); // Return 0 or throw an error if libraryId is essential
      }
      return originalFetchStudentCount(libraryId);
    },
    enabled: !!libraryId, // Only run if libraryId is available
    staleTime: 1000 * 60, // 1 minute stale time for student count
  });

  const { isPro, isSubscriptionExpired, isSubscriptionExpiringSoon } = useSubscription(userDetails);
  const { isStudentLimitReached, isNearingStudentLimit } = useStudentLimit(studentCount, isPro);

  const refresh = useCallback(() => {
    refreshUserDetails();
    refreshLibrary();
    refetchStudentCount();
  }, [refreshUserDetails, refreshLibrary, refetchStudentCount]);

  return {
    user,
    userDetails,
    libraryId,
    studentCount,
    isPro,
    isSubscriptionExpired,
    isSubscriptionExpiringSoon,
    isStudentLimitReached,
    isNearingStudentLimit,
    isLoading: authLoading || profileLoading || libraryLoading || isFetchingCount,
    error: authError || profileError || libraryError || studentCountError,
    refresh,
    fetchStudentCount: originalFetchStudentCount // Still expose if needed elsewhere, though usually not directly called
  };
};
