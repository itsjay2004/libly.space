'use client';

import React, { useState, useRef, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Input } from '@/components/ui/input';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';

// --- No longer needs to be async, it's a client component hook ---
interface Student {
  id: string;
  name: string;
}

export default function StudentLookup() {
  const { user, libraryId } = useUser(); // Using the optimized useUser hook
  const [searchTerm, setSearchTerm] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStudents = useCallback(async (term: string) => {
    if (!user || !libraryId) {
      // Don't set an error here, just don't fetch if user/library isn't ready
      return;
    }

    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { data, error: fetchError } = await supabase
      .from('students')
      .select('id, name')
      .eq('library_id', libraryId)
      .ilike('name', `%${term}%`)
      .limit(5); // Limit results to a reasonable number for a lookup

    if (fetchError) {
      console.error('Error fetching students:', fetchError);
      setError('Failed to fetch students.');
      setStudents([]);
    } else {
      setStudents(data || []);
    }

    setLoading(false);
  }, [user, libraryId]);

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // --- FIX: Only search when the user has typed something (e.g., 2+ chars) ---
    // This prevents any request from firing on the initial page load.
    if (searchTerm.trim().length < 2) {
      setStudents([]);
      setLoading(false);
      setError(null);
      return;
    }

    debounceTimeoutRef.current = setTimeout(() => {
      fetchStudents(searchTerm);
    }, 500); // 500ms debounce to avoid excessive requests while typing

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, fetchStudents]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Lookup</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Search for a student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
          {loading && <div className="flex justify-center"><LoadingSpinner /></div>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <ul className="space-y-2">
            {students.map((student) => (
              <li key={student.id} className="border p-2 rounded-md text-sm hover:bg-muted">
                <Link href={`/dashboard/students/${student.id}`} className="block">
                  {student.name}
                </Link>
              </li>
            ))}
            {searchTerm.trim().length >= 2 && !loading && students.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">No students found.</p>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
