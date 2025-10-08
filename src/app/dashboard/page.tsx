import StatsCard from '@/components/dashboard/stats-card';
import MonthlyCollectionStatus from '@/components/dashboard/monthly-collection-status';
import DueReminders from '@/components/dashboard/due-reminders';
import { Users, UserX, PiggyBank, CircleDollarSign } from 'lucide-react';
import StudentLookup from '@/components/dashboard/student-lookup';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { CustomLink } from '@/components/ui/custom-link'
import { Button } from '@/components/ui/button';
import { Suspense } from 'react';
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import { startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, addMonths, isSameMonth } from 'date-fns';

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
                <p className="mb-4">It looks like you haven't set up your library yet. Add shifts, students to get started.</p>
                <Button asChild>
                    <CustomLink href="/dashboard/library">Go to Settings</CustomLink>
                </Button>
            </div>
        </div>
    );
  }

  const libraryId = libraryData.id;
  const totalSeats = libraryData.total_seats;

  // Fetch shifts for the current library to calculate total seat slots
    const { data: shiftsData, error: shiftsError } = await supabase
    .from('shifts')
    .select('id')
    .eq('library_id', libraryId);

  if (shiftsError) {
    console.error('Error fetching shifts data:', shiftsError);
    return <p>Error loading shifts data.</p>;
  }
  
  const numberOfShifts = shiftsData?.length || 0;
  const totalSeatSlots = totalSeats * numberOfShifts;


  // Fetch students for the current library
  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      status,
      seat_number,
      join_date,
      shift_id,
      shifts ( fee ),
      payments ( amount )
    `)
    .eq('library_id', libraryId);

  if (studentsError) {
    console.error('Error fetching students data:', studentsError);
    return <p>Error loading students data.</p>;
  }

  const studentsWithCalculatedDues = studentsData
    ? studentsData.map(student => {
        const studentPayments = student.payments || [];
        const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        let totalExpectedFee = 0;
        let due = 0;

        if (student.status === 'active' && student.shift_id && student.shifts?.fee !== undefined) {
          const monthlyFee = student.shifts.fee;
          const studentJoinDate = new Date(student.join_date);
          const today = new Date();

          const joinMonthStart = startOfMonth(studentJoinDate);

          if (isSameMonth(studentJoinDate, today)) {
            const daysInJoinMonth = getDaysInMonth(studentJoinDate);
            const activeDaysThisMonth = differenceInDays(today, studentJoinDate) + 1;
            totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysThisMonth;
          } else {
            const joinMonthEnd = endOfMonth(studentJoinDate);
            const daysInJoinMonth = getDaysInMonth(studentJoinDate);
            const activeDaysInJoiningMonth = differenceInDays(joinMonthEnd, studentJoinDate) + 1;
            totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysInJoiningMonth;

            let currentMonthIterator = addMonths(joinMonthStart, 1);
            while (currentMonthIterator < startOfMonth(today)) {
              totalExpectedFee += monthlyFee;
              currentMonthIterator = addMonths(currentMonthIterator, 1);
            }

            const daysInCurrentMonth = getDaysInMonth(today);
            const activeDaysInCurrentMonth = differenceInDays(today, startOfMonth(today)) + 1;
            totalExpectedFee += (monthlyFee / daysInCurrentMonth) * activeDaysInCurrentMonth;
          }
          
          due = totalExpectedFee - totalPaid;
        }

        return {
          ...student,
          calculatedDue: due > 0 ? due : 0,
        };
      })
    : [];

  const activeStudents = studentsData?.filter(s => s.status === 'active').length || 0;
  const studentsWithDues = studentsWithCalculatedDues.filter(s => s.calculatedDue > 0).length;
  const totalDues = studentsWithCalculatedDues.reduce((acc, student) => acc + student.calculatedDue, 0);
  const totalOccupiedSeats = studentsData?.filter(s => s.seat_number !== null).length || 0;
  const seatsAvailable = totalSeatSlots - totalOccupiedSeats;

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
          description={`Out of ${totalSeatSlots} total slots`}
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
