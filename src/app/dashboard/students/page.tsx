import { columns } from '@/components/students/columns';
import { DataTable } from '@/components/students/data-table';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function StudentsPage() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please log in to view students.</p>;
  }

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (libraryError || !libraryData) {
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

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select(`
      *,
      shifts ( * ),
      payments ( amount, status )
    `)
    .eq('library_id', libraryData.id)
    .order('join_date', { ascending: false });

  if (studentsError) {
    console.error('Error fetching students:', studentsError);
    return <p>Error loading students: {studentsError.message}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="bg-card p-4 rounded-lg border">
        <DataTable columns={columns} data={students || []} />
      </div>
    </div>
  );
}
