'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query'; // --- NEW: Import TanStack Query hooks ---

export const useAuth = () => {
  const supabase = createClient();
  const queryClient = useQueryClient(); // Access the query client

  // --- MODIFICATION: Use `useQuery` to fetch the user ---
  const { data: user, isLoading, error, refetch } = useQuery<User | null, Error>({ // Specify types
    queryKey: ['supabaseUser'], // Unique key for this query
    queryFn: async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        throw error; // Let TanStack Query handle the error state
      }
      return user; // Return the user object (or null)
    },
    staleTime: Infinity, // User session is considered fresh until explicitly changed
    gcTime: Infinity, // Keep user data in cache indefinitely
    // Do not refetch on mount, window focus, etc., as we'll handle updates via listener
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    // --- MODIFICATION: Listen for auth state changes and update the query cache directly ---
    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // User signed in or session refreshed, update cache with new user
        queryClient.setQueryData(['supabaseUser'], session.user);
      } else if (event === 'SIGNED_OUT') {
        // User signed out, invalidate and set cache to null
        queryClient.setQueryData(['supabaseUser'], null);
      }
      // You might want to force a refetch here if other components rely on it, e.g., on TOKEN_REFRESH
      // queryClient.invalidateQueries(['supabaseUser']);
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [supabase, queryClient]); // Depend on supabase and queryClient

  return { user, isLoading, error, refresh: refetch }; // Expose refetch for manual refresh if needed
};
