'use client';

import React, { useState, useEffect } from 'react';
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

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(rawSearchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [rawSearchTerm]);

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

  const { data: students, isLoading, isError, error } = useQuery<Student[], Error>({
    queryKey: ['studentLookup', debouncedSearchTerm, libraryId],
    queryFn: () => fetchStudents(debouncedSearchTerm, libraryId!),
    enabled: !!user && !!libraryId && debouncedSearchTerm.trim().length >= 2,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  return (
    <Card className="student-lookup-card">
      <CardHeader>
        <CardTitle>Student Lookup</CardTitle>
        <CardDescription>Search for a student by name.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Start typing a name..."
            value={rawSearchTerm}
            onChange={(e) => setRawSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white/90 px-4 py-2.5 text-sm text-gray-800 placeholder:text-gray-500 shadow-sm focus:border-blue-500  dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-400 dark:focus:border-blue-400 dark:focus:ring-blue-400/30 transition duration-200"
          />
          {isLoading && <div className="flex justify-center pt-4"><LoadingSpinner /></div>}
          {isError && <p className="text-sm text-red-500 text-center pt-4">{error?.message || 'Failed to fetch students.'}</p>}
          <ul className="space-y-2">
            {students?.map((student) => (
              <li key={student.id} className="border p-3 rounded-lg text-sm bg-background/50 hover:bg-muted transition-colors">
                <Link href={`/dashboard/students/${student.id}`} className="block font-medium">
                  {student.name}
                </Link>
              </li>
            ))}
            {debouncedSearchTerm.trim().length >= 2 && !isLoading && students?.length === 0 && (
              <p className="text-sm text-muted-foreground text-center pt-4">No students found.</p>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
