'use client';

import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useQuery } from '@tanstack/react-query';

export const useLibrary = (user: User | null) => {
  const supabase = createClient();

  const fetchLibraryId = async (currentUser: User) => {
    const { data, error } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', currentUser.id)
      .single();

    if (error) {
      // If no library is found, return null instead of throwing an error
      // This matches the original behavior where libraryId would be null on error
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw error;
    }
    return data.id;
  };

  const { data: libraryId, isLoading, error, refetch } = useQuery({
    queryKey: ['libraryId', user?.id],
    queryFn: () => fetchLibraryId(user!),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  return { libraryId, isLoading, error, refresh: refetch };
};
