'use client';

import { useEffect, useState, useCallback } from 'react';
import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import StudentActions from '@/components/students/student-actions';
import { Skeleton } from '@/components/ui/skeleton';

export default function StudentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [libraryExists, setLibraryExists] = useState(true);
  const supabase = createClient();

  const fetchStudents = useCallback(async () => {
    if (user) {
      setLoadingStudents(true);
      const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (libraryError || !libraryData) {
        setLibraryExists(false);
        setLoadingStudents(false);
        return;
      }

      setLibraryExists(true);
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          shifts ( * ),
          payments ( amount ) 
        `)
        .eq('library_id', libraryData.id)
        .order('name', { ascending: true });
      
      if (error) {
        console.error("Error fetching students:", error);
        // Optionally set an error state to show in the UI
      } else {
        setStudents(data || []);
      }
      setLoadingStudents(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (!isUserLoading) {
      fetchStudents();
    }
  }, [isUserLoading, fetchStudents]);

  if (isUserLoading || loadingStudents) {
    return (
      <div className="flex flex-col gap-8">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <p>Please log in to view students.</p>;
  }

  if (!libraryExists) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
          <p className="mb-4">Please set up your library in the settings to manage students.</p>
          <Button asChild>
              <Link href="/dashboard/settings">Go to Settings</Link>
          </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-end mb-4">
          <StudentActions onActionComplete={fetchStudents} />
        </div>
        <DataTable columns={columns} data={students} />
      </div>
    </div>
  );
}
