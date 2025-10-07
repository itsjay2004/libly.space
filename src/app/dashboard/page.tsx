import StatsCard from '@/components/dashboard/stats-card';
import MonthlyCollectionStatus from '@/components/dashboard/monthly-collection-status';
import DueReminders from '@/components/dashboard/due-reminders';
import { Users, UserX, PiggyBank, CircleDollarSign } from 'lucide-react';
import StudentLookup from '@/components/dashboard/student-lookup';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';

async function DashboardData() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please log in to view the dashboard.</p>;
  }

  // Fetch library information for the current user
  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id, total_seats')
    .eq('owner_id', user.id)
    .single();

  if (libraryError && libraryError.code !== 'PGRST116') {
    console.error('Error fetching library data:', libraryError);
    return <p>Error loading library data.</p>;
  }

  if (!libraryData) {
    // New user without a library, show a welcome message and default stats.
    return (
        <div className="flex flex-col gap-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                    title="Total Strength"
                    value="0"
                    icon={<Users className="h-6 w-6 text-primary" />}
                    description="Active students in the library"
                />
                <StatsCard
                    title="Payment Dues"
                    value="0"
                    icon={<UserX className="h-6 w-6 text-destructive" />}
                    description="Students with outstanding payments"
                />
                <StatsCard
                    title="Total Dues"
                    value="₹0"
                    icon={<CircleDollarSign className="h-6 w-6 text-amber-500" />}
                    description="Total outstanding amount"
                />
                <StatsCard
                    title="Seats Available"
                    value="0"
                    icon={<PiggyBank className="h-6 w-6 text-green-500" />}
                    description="Out of 0 total seats"
                />
            </div>
            <div className="text-center p-8 border-2 border-dashed rounded-lg">
                <h2 className="text-2xl font-semibold mb-2">Welcome to your Dashboard!</h2>
                <p className="mb-4">It looks like you haven't set up your library yet. Create one to get started.</p>
                <Button asChild>
                    <Link href="/dashboard/settings">Go to Settings</Link>
                </Button>
            </div>
        </div>
    );
  }

  const libraryId = libraryData.id;
  const totalSeats = libraryData.total_seats;

  // Fetch students for the current library
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      status,
      seat_number,
      payments ( amount, due_date, status )
    `)
    .eq('library_id', libraryId);

  if (studentsError) {
    console.error('Error fetching students data:', studentsError);
    return <p>Error loading students data.</p>;
  }

  const activeStudents = studentsData?.filter(s => s.status === 'active').length || 0;
  const studentsWithDues = studentsData?.filter(s => 
    s.payments && s.payments.some(p => p.status === 'due')
  ).length || 0;

  const totalDues = studentsData?.reduce((acc, student) => {
    const studentDues = student.payments?.reduce((paymentAcc, payment) => {
      return payment.status === 'due' ? paymentAcc + (payment.amount || 0) : paymentAcc;
    }, 0) || 0;
    return acc + studentDues;
  }, 0) || 0;

  const totalOccupiedSeats = studentsData?.filter(s => s.seat_number !== null).length || 0;
  const seatsAvailable = totalSeats - totalOccupiedSeats;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Strength" 
          value={activeStudents.toString()} 
          icon={<Users className="h-6 w-6 text-primary" />} 
          description="Active students in the library"
        />
        <StatsCard 
          title="Payment Dues" 
          value={studentsWithDues.toString()} 
          icon={<UserX className="h-6 w-6 text-destructive" />} 
          description="Students with outstanding payments"
        />
        <StatsCard 
          title="Total Dues" 
          value={`₹${totalDues.toLocaleString()}`} 
          icon={<CircleDollarSign className="h-6 w-6 text-amber-500" />} 
          description="Total outstanding amount"
        />
        <StatsCard 
          title="Seats Available" 
          value={seatsAvailable.toString()} 
          icon={<PiggyBank className="h-6 w-6 text-green-500" />} 
          description={`Out of ${totalSeats} total seats`}
        />
      </div>

      <div className="grid gap-8">
         <StudentLookup />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <DueReminders />
        </div>
        <div className="lg:col-span-1">
          <MonthlyCollectionStatus />
        
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardData />
    </Suspense>
  );
}
