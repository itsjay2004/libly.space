'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      setIsLoading(true);
      setError(null);
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        setError(error.message);
        setUser(null);
      } else {
        setUser(user);
      }
      setIsLoading(false);
    };

    getUser();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, [supabase]);

  return { user, isLoading, error };
};