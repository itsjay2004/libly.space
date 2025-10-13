'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

// Define the shape of the user details from the 'profiles' table
interface UserDetails {
  full_name: string;
  phone: string;
  library_id: string;
  subscription_status: string;
  subscription_end_date: string;
  // Add other profile fields as needed
}

interface UseUserResult {
  user: User | null;
  userDetails: UserDetails | null;
  isLoading: boolean;
  error: string | null;
  refreshUserDetails: () => void;
  studentCount: number;
  isPro: boolean;
  isStudentLimitReached: boolean;
  isNearingStudentLimit: boolean;
  isSubscriptionExpired: boolean;
  isSubscriptionExpiringSoon: boolean;
  fetchStudentCount: (libraryId: string) => void
  libId: string
}

export const useUser = (): UseUserResult => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [studentCount, setStudentCount] = useState(0);
  const [isPro, setIsPro] = useState(false);
  const [isStudentLimitReached, setIsStudentLimitReached] = useState(false);
  const [isNearingStudentLimit, setIsNearingStudentLimit] = useState(false);
  const [isSubscriptionExpired, setIsSubscriptionExpired] = useState(false);
  const [isSubscriptionExpiringSoon, setIsSubscriptionExpiringSoon] = useState(false);
  const [libId, setLibid] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchStudentCount = useCallback(async (libraryId: string) => {
    const countStudent = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('library_id', libraryId);

    if (error) {
      console.error("Error fetching student count:", error);
      return 0;
    }
    return countStudent ?? 0;
  }, [supabase]);

  const fetchUserDetails = useCallback(async (user: User | null) => {
    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
        setUserDetails(null);
        setStudentCount(0);
      } else {
        setLibid(data.library_id)
        setUserDetails(data as UserDetails);
        const count = await fetchStudentCount(data.library_id);
        // setStudentCount(count);
      }
    } else {
      setUserDetails(null);
      setStudentCount(0);
    }
  }, [supabase, fetchStudentCount]);

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      setError(null);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setError(error.message);
        setUser(null);
        setUserDetails(null);
      } else {
        setUser(user);
        await fetchUserDetails(user);
      }
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user || null;
      setUser(user);
      await fetchUserDetails(user);

      if (event === 'SIGNED_OUT') {
        setUserDetails(null);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [supabase, fetchUserDetails]);

  useEffect(() => {
    if (userDetails) {
      const isProUser = userDetails.subscription_status === 'active';
      setIsPro(isProUser);

      const subscriptionEndDate = userDetails.subscription_end_date ? new Date(userDetails.subscription_end_date) : null;
      const now = new Date();

      // Subscription status
      if (subscriptionEndDate && subscriptionEndDate < now) {
        setIsSubscriptionExpired(true);
      } else if (subscriptionEndDate) {
        const daysRemaining = (subscriptionEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        if (daysRemaining <= 7) {
          setIsSubscriptionExpiringSoon(true);
        }
      }

      // Free user student limits
      if (!isProUser) {
        if (studentCount >= 50) {
          setIsStudentLimitReached(true);
        }
        if (studentCount >= 40 && studentCount < 50) {
          setIsNearingStudentLimit(true);
        }
      }
    }
  }, [userDetails, studentCount]);

  const refreshUserDetails = useCallback(async () => {
    setIsLoading(true);
    await fetchUserDetails(user);
    setIsLoading(false);
  }, [user, fetchUserDetails]);

  return { user, userDetails, isLoading, error, refreshUserDetails, studentCount, isPro, isStudentLimitReached, isNearingStudentLimit, isSubscriptionExpired, isSubscriptionExpiringSoon, fetchStudentCount, libId };
};
