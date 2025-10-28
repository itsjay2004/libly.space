import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import { format } from 'date-fns';
import { Users, TrendingUp, PiggyBank, UserX } from 'lucide-react';
import { fetchDashboardStatsSERVER, DashboardStats } from '@/lib/supabase/dashboard'; 
import DashboardSkeleton from '@/components/dashboard/dashboard-skeleton';
import StatsCard from '@/components/dashboard/stats-card';
import StudentLookup from '@/components/dashboard/student-lookup';
import ExpiringSoon from '@/components/dashboard/expiring-soon';
import MonthlyRevenueChart from '@/components/dashboard/monthly-revenue-chart';
import PaymentMethodChart from '@/components/dashboard/payment-method-chart';
import { CustomLink } from '@/components/ui/custom-link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import StudentActions from '@/components/students/student-actions';
import QuickAddPayment from '@/components/dashboard/quick-add-payment';

export const metadata: Metadata = {
  title: 'Dashboard - Libly Space',
  description: 'Library management for modern libraries',
};

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
  const stats: DashboardStats | null = await fetchDashboardStatsSERVER();

  if (!stats) {
    return <p>Error loading dashboard data. Please try again later.</p>;
  }
  
  const occupancyRate = total_seats > 0 ? Math.round((stats.occupiedSeats / total_seats) * 100) : 0;
  
  const monthlyRevenueForChart = stats.revenueChartData.map(d => ({
    month: format(new Date(d.month), 'MMM yyyy'),
    total: d.revenue
  }));

  const paymentMethodChartData = stats.paymentMethodStats.map(pm => ({
    payment_method: pm.payment_method,
    total: pm.total_amount,
  }));

  return (
    <div className="flex flex-col gap-6">
      <Card className="quick-actions-card border">
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
        <StatsCard title="Active Members" value={stats.activeMembers.toString()} icon={<Users className="text-blue-500" />} description="Students with an active membership." gradient="gradient-1" />
        <StatsCard title="Occupancy Rate" value={`${occupancyRate}%`} icon={<TrendingUp className="text-green-500" />} description={`${stats.occupiedSeats} of ${total_seats || 0} seats filled.`} gradient="gradient-2" />
        <StatsCard title="This Month's Revenue" value={`₹${stats.monthlyRevenue.toLocaleString()}`} icon={<PiggyBank className="text-yellow-500" />} description={`Total collection for ${format(new Date(), 'MMMM')}.`} gradient="gradient-3" />
        <StatsCard title="Expiring Soon" value={stats.expiringSoonCount.toString()} icon={<UserX className="text-red-500" />} description="Memberships ending in the next 10 days." gradient="gradient-4" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <MonthlyRevenueChart data={monthlyRevenueForChart} />
          <StudentLookup /> 
        </div>
        <div className="lg:col-span-1 flex flex-col gap-6">
          <PaymentMethodChart data={paymentMethodChartData} />
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
