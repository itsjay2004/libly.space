import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { format, startOfMonth, subMonths, isFuture, addDays, startOfToday } from 'date-fns';
import { Users, TrendingUp, PiggyBank, UserX } from 'lucide-react';

import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import StatsCard from '@/components/dashboard/stats-card';
import StudentLookup from '@/components/dashboard/student-lookup';
import ExpiringSoon from '@/components/dashboard/expiring-soon'; // Corrected import name
import MonthlyRevenueChart from '@/components/dashboard/monthly-revenue-chart';
import { CustomLink } from '@/components/ui/custom-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StudentActions from '@/components/students/student-actions';
import QuickAddPayment from '@/components/dashboard/quick-add-payment';

async function DashboardData() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please log in to view the dashboard.</p>;

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id, total_seats')
    .eq('owner_id', user.id)
    .single();

  if (libraryError || !libraryData) {
    return (
      <div className="text-center p-8 border-2 border-dashed rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Welcome to Your Dashboard!</h2>
        <p className="mb-4">To get started, please set up your library details in the settings.</p>
        <Button asChild><CustomLink href="/dashboard/library">Go to Library Settings</CustomLink></Button>
      </div>
    );
  }

  const { id: libraryId, total_seats } = libraryData;

  // --- Data Fetching ---
  const today = startOfToday();
  const sixMonthsAgo = startOfMonth(subMonths(today, 5));

  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select('id, seat_number, membership_expiry_date')
    .eq('library_id', libraryId);

  const { data: paymentsData, error: paymentsError } = await supabase
    .from('payments')
    .select('amount, payment_date')
    .eq('library_id', libraryId)
    .gte('payment_date', sixMonthsAgo.toISOString());
  
  const { count: shiftsCount, error: shiftsError } = await supabase
    .from('shifts')
    .select('*', { count: 'exact', head: true })
    .eq('library_id', libraryId);

  if (studentsError || paymentsError || shiftsError) {
    console.error({ studentsError, paymentsError, shiftsError });
    return <p>Error loading dashboard data.</p>;
  }

  // --- KPI Calculations ---
  const activeMembers = studentsData.filter(s => s.membership_expiry_date && isFuture(new Date(s.membership_expiry_date))).length;
  const sevenDaysFromNow = addDays(today, 7);
  const expiringSoonCount = studentsData.filter(s => s.membership_expiry_date && new Date(s.membership_expiry_date) >= today && new Date(s.membership_expiry_date) <= sevenDaysFromNow).length;

  const totalSeatSlots = total_seats * (shiftsCount || 0);
  const occupiedSeats = studentsData.filter(s => s.seat_number !== null).length;
  const occupancyRate = totalSeatSlots > 0 ? Math.round((occupiedSeats / totalSeatSlots) * 100) : 0;

  const currentMonthStart = startOfMonth(today);
  const thisMonthRevenue = paymentsData
    .filter(p => new Date(p.payment_date) >= currentMonthStart)
    .reduce((acc, p) => acc + p.amount, 0);

  // --- Chart Data Preparation ---
  const monthlyRevenue = Array.from({ length: 6 }).map((_, i) => {
    const month = subMonths(today, i);
    const monthStart = startOfMonth(month);
    const total = paymentsData
      .filter(p => {
        const paymentMonth = startOfMonth(new Date(p.payment_date));
        return paymentMonth.getTime() === monthStart.getTime();
      })
      .reduce((acc, p) => acc + p.amount, 0);
    return { month: format(monthStart, 'MMM yyyy'), total };
  }).reverse();

  return (
    <div className="flex flex-col gap-6">
       {/* --- Quick Actions Header --- */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
                <h2 className="text-xl font-semibold">Quick Actions</h2>
                <p className="text-sm text-muted-foreground">Instantly add a new student or record a payment.</p>
            </div>
            <div className="flex items-center gap-2">
                <StudentActions />
                <QuickAddPayment libraryId={libraryId} />
            </div>
        </CardContent>
      </Card>
      
      {/* --- KPI Cards --- */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Active Members" value={activeMembers.toString()} icon={<Users />} description="Students with an active membership." />
        <StatsCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={<TrendingUp />} description={`${occupiedSeats} of ${totalSeatSlots} slots filled.`} />
        <StatsCard title="This Month's Revenue" value={`₹${thisMonthRevenue.toLocaleString()}`} icon={<PiggyBank />} description={`Total collection for ${format(today, 'MMMM')}.`} />
        <StatsCard title="Expiring Soon" value={expiringSoonCount.toString()} icon={<UserX />} description="Memberships ending in the next 7 days." />
      </div>

      {/* --- Main Layout --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MonthlyRevenueChart data={monthlyRevenue} />
          <StudentLookup />
        </div>
        {/* Right Column */}
        <div className="lg:col-span-1">
          <ExpiringSoon /> {/* Corrected component name */}
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
