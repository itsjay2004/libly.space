'use client';

import { useEffect, useState, useCallback } from 'react';
import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSharedUser } from '@/contexts/UserContext';
import { createClient } from '@/lib/supabase/client';
import StudentActions from '@/components/students/student-actions';
import { Skeleton } from '@/components/ui/skeleton';
import { PaginationState, SortingState, ColumnFiltersState } from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import type { Student, Shift } from '@/lib/types';

type StudentWithShift = Student & { shifts: Shift | null };

export default function StudentsPage() {
  const { user, libraryId, isUserLoading: isUserContextLoading } = useSharedUser();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([]);
  const [filters, setFilters] = useState<ColumnFiltersState>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState<string>('');

  useEffect(() => {
    document.title = `Students - Libly Space`;
  }, [])

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Update searchTerm from global filter
  useEffect(() => {
    const globalFilterEntry = filters.find(f => f.id === 'global');
    const newSearchTerm = (globalFilterEntry && typeof globalFilterEntry.value === 'string')
      ? globalFilterEntry.value
      : '';

    if (newSearchTerm !== searchTerm) {
      setSearchTerm(newSearchTerm);
    }
  }, [filters, searchTerm]);

  const supabase = createClient();

  const fetchStudentsQueryFn = useCallback(async () => {
    if (!libraryId) {
      return { data: [], count: 0 };
    }

    const from = pagination.pageIndex * pagination.pageSize;
    const to = from + pagination.pageSize - 1;

    let query = supabase
      .from('students')
      .select(`
        *,
        shifts ( * )
      `, { count: 'exact' })
      .eq('library_id', libraryId)
      .range(from, to);

    if (sorting.length > 0) {
      query = query.order(sorting[0].id, { ascending: !sorting[0].desc });
    } else {
      query = query.order('name', { ascending: true });
    }

    if (debouncedSearchTerm) {
      query = query.or(`name.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }
    return { data: data || [], count: count || 0 };
  }, [libraryId, supabase, pagination, sorting, debouncedSearchTerm]);

  const { data, isLoading, isError, error } = useQuery<{ data: StudentWithShift[], count: number }, Error>({
    queryKey: ['students', libraryId, pagination, sorting, debouncedSearchTerm],
    queryFn: fetchStudentsQueryFn,
    enabled: !!user && !!libraryId,
    keepPreviousData: true,
    staleTime: 1000 * 30,
  });

  const students = data?.data || [];
  const pageCount = Math.ceil((data?.count || 0) / pagination.pageSize);

  if (isUserContextLoading) {
    return <StudentsPageSkeleton />;
  }

  if (!user) {
    return <p>Please log in to view students.</p>;
  }

  if (!libraryId) {
    return <NoLibraryFound />;
  }

  return (
    <>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight">All Students</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage your students and their information
              </p>
            </div>
            <StudentActions />
          </div>

          <DataTable
            columns={columns}
            data={students}
            pageCount={pageCount}
            isLoading={isLoading}
            pagination={pagination}
            sorting={sorting}
            filters={filters}
            setPagination={setPagination}
            setSorting={setSorting}
            setFilters={setFilters}
          />
        </div>
      </div>
    </>

  );
}

const StudentsPageSkeleton = () => (
  <div className="container mx-auto py-6 space-y-6">
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

const NoLibraryFound = () => (
  <div className="container mx-auto py-8">
    <div className="text-center p-8 border-2 border-dashed rounded-lg">
      <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
      <p className="mb-4">Please set up your library in the settings to manage students.</p>
      <Button asChild>
        <Link href="/dashboard/library">Go to Library Settings</Link>
      </Button>
    </div>
  </div>
);