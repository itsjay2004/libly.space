'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

interface Student {
  id: string;
  name: string;
}

export default function StudentLookup() {
  const { user, libraryId } = useUser();
  const [rawSearchTerm, setRawSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce the search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(rawSearchTerm);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [rawSearchTerm]);

  // Query function to fetch students
  const fetchStudents = async (term: string, currentLibraryId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('students')
      .select('id, name')
      .eq('library_id', currentLibraryId)
      .ilike('name', `%${term}%`)
      .limit(5);

    if (error) {
      throw error;
    }
    return data || [];
  };

  // TanStack Query for student lookup
  const { data: students, isLoading, isError, error } = useQuery<Student[], Error>({
    queryKey: ['studentLookup', debouncedSearchTerm, libraryId],
    queryFn: () => fetchStudents(debouncedSearchTerm, libraryId!),
    enabled: !!user && !!libraryId && debouncedSearchTerm.trim().length >= 2, // Only run query if conditions met
    staleTime: 1000 * 30, // 30 seconds stale time for search results
    gcTime: 1000 * 60 * 5, // 5 minutes garbage collection time
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Lookup</CardTitle>
        <CardDescription>Search for a student by name or phone number.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search for a student..."
            value={rawSearchTerm}
            onChange={(e) => setRawSearchTerm(e.target.value)}
            className="w-full"
          />
          {isLoading && <div className="flex justify-center"><LoadingSpinner /></div>}
          {isError && <p className="text-sm text-red-500">{error?.message || 'Failed to fetch students.'}</p>}
          <ul className="space-y-2">
            {students?.map((student) => (
              <li key={student.id} className="border p-2 rounded-md text-sm hover:bg-muted">
                <Link href={`/dashboard/students/${student.id}`} className="block">
                  {student.name}
                </Link>
              </li>
            ))}
            {debouncedSearchTerm.trim().length >= 2 && !isLoading && students?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">No students found.</p>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
