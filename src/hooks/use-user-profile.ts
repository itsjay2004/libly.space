'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

interface UserDetails {
  full_name: string;
  phone: string;
  subscription_status: string;
  subscription_end_date: string;
  onboarding_status: string;
}

export const useUserProfile = (user: User | null) => {
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchUserProfile = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        setError(error.message);
        setUserDetails(null);
      } else {
        setUserDetails(data as UserDetails);
      }
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  return { userDetails, isLoading, error, refresh: fetchUserProfile };
};