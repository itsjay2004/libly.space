'use client';

import { useEffect, useState } from 'react';
import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';

export default function StudentsPage() {
  const { 
    user, 
    isLoading,
    isStudentLimitReached,
    isSubscriptionExpired
  } = useUser();
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [libraryExists, setLibraryExists] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchStudents = async () => {
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
            payments ( amount, status )
          `)
          .eq('library_id', libraryData.id)
          .order('join_date', { ascending: false });
        
        if (data) setStudents(data);
        setLoadingStudents(false);
      }
    };
    
    if (user) {
      fetchStudents();
    }
  }, [user, supabase]);

  if (isLoading || loadingStudents) {
    return <p>Loading...</p>;
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

  const disableAddStudent = isStudentLimitReached || isSubscriptionExpired;

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-card p-4 rounded-lg border">
        <div className="flex justify-end mb-4">
          <Button asChild disabled={disableAddStudent}>
            <Link href="/dashboard/students/new">Add Student</Link>
          </Button>
        </div>
        <DataTable columns={columns} data={students || []} />
      </div>
    </div>
  );
}
