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
}

export const useUser = (): UseUserResult => {
  const [user, setUser] = useState<User | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

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
      } else {
        setUserDetails(data as UserDetails);
      }
    } else {
      setUserDetails(null);
    }
  }, [supabase]);

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

  const refreshUserDetails = useCallback(() => {
    fetchUserDetails(user);
  }, [user, fetchUserDetails]);

  return { user, userDetails, isLoading, error, refreshUserDetails };
};
