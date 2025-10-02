import { students, librarySettings } from '@/lib/data';
import StatsCard from '@/components/dashboard/stats-card';
import MonthlyCollectionStatus from '@/components/dashboard/monthly-collection-status';
import DueReminders from '@/components/dashboard/due-reminders';
import { Users, UserX, PiggyBank, CircleDollarSign } from 'lucide-react';
import StudentLookup from '@/components/dashboard/student-lookup';

export default function DashboardPage() {
  const activeStudents = students.filter(s => s.status === 'active').length;
  const studentsWithDues = students.filter(s => s.feeDetails.due > 0).length;
  const totalDues = students.reduce((acc, s) => acc + s.feeDetails.due, 0);
  
  const totalOccupiedSeats = students.filter(s => s.status === 'active' && s.seatNumber !== null).length;
  const seatsAvailable = librarySettings.totalSeats - totalOccupiedSeats;

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
          description={`Out of ${librarySettings.totalSeats} total seats`}
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
