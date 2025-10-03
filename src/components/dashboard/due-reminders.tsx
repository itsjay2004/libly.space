import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import Link from "next/link";
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { startOfMonth, endOfMonth, differenceInMonths, differenceInDays, getDaysInMonth, addMonths, isSameMonth } from 'date-fns';
import type { Student, Payment, Shift } from '@/lib/types';

interface StudentWithDues extends Student {
  calculatedDue: number;
}

export default async function DueReminders() {
  const cookieStore = cookies();
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <p>Please log in to view due reminders.</p>;
  }

  const { data: libraryData, error: libraryError } = await supabase
    .from('libraries')
    .select('id')
    .eq('owner_id', user.id)
    .single();

  if (libraryError || !libraryData) {
    console.error("Error fetching library for due reminders:", libraryError);
    return <p>Error loading due reminders.</p>;
  }

  const libraryId = libraryData.id;

  const { data: studentsData, error: studentsError } = await supabase
    .from('students')
    .select(`
      id,
      name,
      phone,
      status,
      join_date,
      shift_id,
      shifts ( fee ),
      payments ( amount, status, for_month, payment_date )
    `)
    .eq('library_id', libraryId);

  if (studentsError) {
    console.error("Error fetching students for due reminders:", studentsError);
    return <p>Error loading due reminders.</p>;
  }

  const studentsWithCalculatedDues: StudentWithDues[] = studentsData
    ? studentsData.map(student => {
        const studentPayments = student.payments || [];
        const totalPaid = studentPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
        let totalExpectedFee = 0;
        let due = 0;

        if (student.status === 'active' && student.shift_id && student.shifts?.fee !== undefined) {
          const monthlyFee = student.shifts.fee;
          const studentJoinDate = new Date(student.join_date);
          const today = new Date(); // Current date

          // 1. Calculate fee for the joining month (pro-rata)
          const joinMonthStart = startOfMonth(studentJoinDate);
          const joinMonthEnd = endOfMonth(studentJoinDate);

          if (isSameMonth(studentJoinDate, today)) {
            // If the student joined in the current month, calculate pro-rata from join_date to today
            const daysInJoinMonth = getDaysInMonth(studentJoinDate);
            const activeDaysThisMonth = differenceInDays(today, studentJoinDate) + 1; // Inclusive
            totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysThisMonth;
          } else {
            // Student joined in a previous month
            // Pro-rata for the joining month (from join_date to end of join_month)
            const daysInJoinMonth = getDaysInMonth(studentJoinDate);
            const activeDaysInJoiningMonth = differenceInDays(joinMonthEnd, studentJoinDate) + 1;
            totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysInJoiningMonth;

            // Calculate full months between joining month and current month
            let currentMonthIterator = addMonths(joinMonthStart, 1); // Start from the month *after* joining
            while (currentMonthIterator < startOfMonth(today)) {
              totalExpectedFee += monthlyFee;
              currentMonthIterator = addMonths(currentMonthIterator, 1);
            }

            // Calculate pro-rata for the current month (from start of month to today)
            const daysInCurrentMonth = getDaysInMonth(today);
            const activeDaysInCurrentMonth = differenceInDays(today, startOfMonth(today)) + 1;
            totalExpectedFee += (monthlyFee / daysInCurrentMonth) * activeDaysInCurrentMonth;
          }
          
          due = totalExpectedFee - totalPaid;
        }

        return {
          ...student,
          calculatedDue: due > 0 ? due : 0,
        } as StudentWithDues;
      })
    : [];

  const studentsWithDues = studentsWithCalculatedDues
    .filter((student) => student.calculatedDue > 0)
    .sort((a, b) => b.calculatedDue - a.calculatedDue)
    .slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Due Reminders</CardTitle>
        <CardDescription>Students with the highest outstanding dues.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {studentsWithDues.length > 0 ? (
            studentsWithDues.map((student) => (
            <div key={student.id} className="flex items-center">
              <Avatar className="h-9 w-9">
                 <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{student.name}</p>
                <p className="text-sm text-muted-foreground">{student.phone}</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <span className="font-medium text-destructive">₹{student.calculatedDue.toLocaleString()}</span>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/students/${student.id}`}>View</Link>
                </Button>
              </div>
            </div>
            ))
        ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No outstanding dues. Great work!</p>
        )}
      </CardContent>
    </Card>
  )
}
