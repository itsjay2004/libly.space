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
import { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';

export default function StudentsPage() {
  const { user, isLoading: isUserLoading } = useUser();
  const [students, setStudents] = useState<any[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [libraryExists, setLibraryExists] = useState(true);
  const [pageCount, setPageCount] = useState(0);
  
  // State for server-side operations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);

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

      const from = pagination.pageIndex * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      let query = supabase
        .from('students')
        .select(`
          *,
          shifts ( * )
        `, { count: 'exact' })
        .eq('library_id', libraryData.id)
        .range(from, to);

      if (sorting.length > 0) {
        query = query.order(sorting[0].id, { ascending: !sorting[0].desc });
      } else {
        query = query.order('name', { ascending: true });
      }
      
      const globalFilter = filters.find(f => f.id === 'global');
      if (globalFilter && typeof globalFilter.value === 'string') {
        query = query.or(`name.ilike.%${globalFilter.value}%,phone.ilike.%${globalFilter.value}%`);
      }

      const { data, error, count } = await query;
      
      if (error) {
        console.error("Error fetching students:", error);
      } else {
        setStudents(data || []);
        setPageCount(Math.ceil((count || 0) / pagination.pageSize));
      }
      setLoadingStudents(false);
    }
  }, [user, supabase, pagination, sorting, filters]);

  useEffect(() => {
    if (!isUserLoading && user) {
      fetchStudents();
    }
  }, [isUserLoading, user, fetchStudents]);
  
  // --- REMOVED: onStateChange handler as we are now passing setters directly ---

  if (isUserLoading) {
    return <StudentsPageSkeleton />;
  }

  if (!user) {
    return <p>Please log in to view students.</p>;
  }

  if (!libraryExists && !loadingStudents) {
    return <NoLibraryFound />;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex justify-end mb-4">
          <StudentActions onActionComplete={fetchStudents} />
        </div>
        {/* --- MODIFICATION: Passing state and setters directly to DataTable --- */}
        <DataTable 
            columns={columns} 
            data={students}
            pageCount={pageCount}
            isLoading={loadingStudents}
            pagination={pagination}
            sorting={sorting}
            filters={filters}
            setPagination={setPagination}
            setSorting={setSorting}
            setFilters={setFilters}
        />
      </div>
    </div>
  );
}

const StudentsPageSkeleton = () => (
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

const NoLibraryFound = () => (
    <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
        <p className="mb-4">Please set up your library in the settings to manage students.</p>
        <Button asChild>
            <Link href="/dashboard/settings">Go to Settings</Link>
        </Button>
    </div>
);