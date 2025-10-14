'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useUserProfile } from './use-user-profile';
import { useLibrary } from './use-library';
import { useSubscription } from './use-subscription';
import { useStudentLimit } from './use-student-limit';
import { fetchStudentCount } from '@/lib/student-count-data';

export const useUser = () => {
  const { user, isLoading: authLoading, error: authError } = useAuth();
  const { userDetails, isLoading: profileLoading, error: profileError, refresh: refreshUserDetails } = useUserProfile(user);
  const { libraryId, isLoading: libraryLoading, error: libraryError, refresh: refreshLibrary } = useLibrary(user);
  
  const [studentCount, setStudentCount] = useState(0);
  const [isFetchingCount, setIsFetchingCount] = useState(false);

  const { isPro, isSubscriptionExpired, isSubscriptionExpiringSoon } = useSubscription(userDetails);
  const { isStudentLimitReached, isNearingStudentLimit } = useStudentLimit(studentCount, isPro);

  const getStudentCount = useCallback(async () => {
    if (libraryId) {
      setIsFetchingCount(true);
      const count = await fetchStudentCount(libraryId);
      setStudentCount(count);
      setIsFetchingCount(false);
    }
  }, [libraryId]);

  useEffect(() => {
    getStudentCount();
  }, [getStudentCount]);

  const refresh = useCallback(() => {
    refreshUserDetails();
    refreshLibrary();
    getStudentCount();
  }, [refreshUserDetails, refreshLibrary, getStudentCount]);

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
    error: authError || profileError || libraryError,
    refresh,
    fetchStudentCount
  };
};