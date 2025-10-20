import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { format } from 'date-fns';
import { Users, TrendingUp, PiggyBank, UserX } from 'lucide-react';
// --- FIX: Using the correct SERVER function ---
import { fetchDashboardStatsSERVER, DashboardStats } from '@/lib/supabase/dashboard'; 

import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import StatsCard from '@/components/dashboard/stats-card';
import StudentLookup from '@/components/dashboard/student-lookup';
import ExpiringSoon from '@/components/dashboard/expiring-soon';
import MonthlyRevenueChart from '@/components/dashboard/monthly-revenue-chart';
import { CustomLink } from '@/components/ui/custom-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StudentActions from '@/components/students/student-actions';
import QuickAddPayment from '@/components/dashboard/quick-add-payment';
// Note: PaymentMethodChart might need a separate, specific query if not included in stats
// For now, let's assume we can adapt or simplify it.

async function DashboardData() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return <p>Please log in to view the dashboard.</p>;

  // Library check is now handled inside the stats function, but we still need id for QuickAddPayment
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

  // --- FIX: A single, correct call to the server-side helper ---
  const stats: DashboardStats | null = await fetchDashboardStatsSERVER();

  if (!stats) {
    return <p>Error loading dashboard data. Please try again later.</p>;
  }
  
  // Occupancy rate calculation remains client-side as it depends on `total_seats`
  const occupancyRate = total_seats > 0 ? Math.round((stats.occupiedSeats / total_seats) * 100) : 0;
  
  const monthlyRevenueForChart = stats.revenueChartData.map(d => ({
    month: format(new Date(d.month), 'MMM yyyy'),
    total: d.revenue
  }));

  return (
    <div className="flex flex-col gap-6">
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
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard title="Active Members" value={stats.activeMembers.toString()} icon={<Users />} description="Students with an active membership." />
        <StatsCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={<TrendingUp />} description={`${stats.occupiedSeats} of ${total_seats || 0} seats filled.`} />
        <StatsCard title="This Month's Revenue" value={`₹${stats.monthlyRevenue.toLocaleString()}`} icon={<PiggyBank />} description={`Total collection for ${format(new Date(), 'MMMM')}.`} />
        <StatsCard title="Expiring Soon" value={stats.expiringSoonCount.toString()} icon={<UserX />} description="Memberships ending in the next 10 days." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MonthlyRevenueChart data={monthlyRevenueForChart} />
          {/* StudentLookup is now self-contained and optimized */}
          <StudentLookup /> 
        </div>
        <div className="lg:col-span-1">
          {/* --- FIX: Passing the pre-fetched list to the component --- */}
          <ExpiringSoon expiringStudents={stats.expiringSoonList} />
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
