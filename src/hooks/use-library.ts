'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export const useLibrary = (user: User | null) => {
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchLibrary = useCallback(async () => {
    if (user) {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (error) {
        setError(error.message);
        setLibraryId(null);
      } else {
        setLibraryId(data.id);
      }
      setIsLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    fetchLibrary();
  }, [fetchLibrary]);

  return { libraryId, isLoading, error, refresh: fetchLibrary };
};