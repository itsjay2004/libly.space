'use client';

import { createClient } from '@/lib/supabase/client';

export const fetchStudentCount = async (libraryId: string) => {
  const supabase = createClient();
  const { count, error } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('library_id', libraryId);

  if (error) {
    console.error('Error fetching student count:', error);
    return 0;
  }
  return count ?? 0;
};
