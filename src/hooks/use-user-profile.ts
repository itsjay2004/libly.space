'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

interface UserDetails {
  full_name: string;
  phone: string;
  subscription_status: string;
  subscription_end_date: string;
  onboarding_status: string;
}

export const useUserProfile = (user: User | null) => {
  const supabase = createClient();

  const fetchUserProfileData = async (currentUser: User) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUser.id)
      .single();

    if (error) {
      throw error;
    }
    return data as UserDetails;
  };

  const { data: userDetails, isLoading, error, refetch } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: () => fetchUserProfileData(user!),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes (Garbage Collection Time)
  });

  return { userDetails, isLoading, error, refresh: refetch };
};
