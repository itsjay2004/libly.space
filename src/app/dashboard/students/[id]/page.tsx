"use client";

import { createClient } from '@/lib/supabase/client';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, Armchair } from 'lucide-react';
import PaymentsList from '@/components/payments/payments-list';
import ClientStudentActions from '@/components/students/client-student-actions';
import ClientAddPaymentForm from '@/components/payments/client-add-payment-form';
import { startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, addMonths, isSameMonth } from 'date-fns';
import { useEffect, useState } from 'react';
import { useUser } from '@/hooks/use-user';

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const studentId = params.id;

  const { user, isLoading: userLoading, error: userError } = useUser();
  const [student, setStudent] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // New state variable for refresh

  const supabase = createClient(); 

  useEffect(() => {
    const fetchStudentData = async () => {
      if (userLoading || !user) return;

      setLoadingStudent(true);
      setFetchError(null);

      const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (libraryError || !libraryData) {
        console.error("Error fetching library:", libraryError);
        setFetchError("Could not load library data.");
        setLoadingStudent(false);
        return;
      }
      setLibraryId(libraryData.id);

      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          shifts ( name, start_time, end_time, fee ),
          payments ( id, amount, status, for_month, payment_date )
        `)
        .eq('id', studentId)
        .eq('library_id', libraryData.id)
        .single();

      if (studentError || !studentData) {
        console.error('Error fetching student:', studentError);
        setFetchError("Student not found or an error occurred.");
        setLoadingStudent(false);
        return;
      }

      setStudent(studentData);
      setLoadingStudent(false);
    };

    fetchStudentData();
  }, [user, userLoading, studentId, supabase, refreshTrigger]); // Add refreshTrigger to dependencies

  if (userLoading || loadingStudent) {
    return <p>Loading student profile...</p>;
  }

  if (userError || fetchError) {
    return <p>Error: {userError || fetchError}</p>;
  }

  if (!user || !student) {
    notFound(); 
  }

  const formattedJoinDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(student.join_date));

  let calculatedDue = 0;
  const totalPaid = student.payments.reduce((acc: number, p: any) => acc + (p.amount || 0), 0);

  if (student.status === 'active' && student.shift_id && student.shifts?.fee !== undefined) {
    const monthlyFee = student.shifts.fee;
    const studentJoinDate = new Date(student.join_date);
    const today = new Date(); 

    let totalExpectedFee = 0;

    const joinMonthStart = startOfMonth(studentJoinDate);
    const joinMonthEnd = endOfMonth(studentJoinDate);

    if (isSameMonth(studentJoinDate, today)) {
      const daysInJoinMonth = getDaysInMonth(studentJoinDate);
      const activeDaysThisMonth = differenceInDays(today, studentJoinDate) + 1; 
      totalExpectedFee += (monthlyFee / daysInJoinMonth) * activeDaysThisMonth;
    } else {
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
    
    calculatedDue = totalExpectedFee - totalPaid;
  }

  const handlePaymentDeleted = () => {
    router.refresh(); // Invalidate Next.js cache for the current route
    setRefreshTrigger(prev => prev + 1); // Trigger client-side re-fetch
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-end">
        <ClientStudentActions student={student} />
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="h-24 w-24">
          <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
          <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{student.name}</h1>
          <p className="text-muted-foreground">Student ID: {student.id.substring(0, 8)}</p>
          <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={student.status === 'active' ? 'bg-green-500/80 text-white mt-2' : 'bg-red-500/80 text-white mt-2'}>
            {student.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> {student.email}
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" /> {student.phone}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Library Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" /> Joined: {formattedJoinDate}
            </div>
            <div className="flex items-center gap-2">
              <Armchair className="h-4 w-4 text-muted-foreground" /> Seat No: {student.seat_number || 'N/A'}
            </div>
            <div className="flex items-center gap-2">
              Shift: {student.shifts?.name || 'N/A'} {student.shifts?.start_time && student.shifts?.end_time ? `(${student.shifts.start_time} - ${student.shifts.end_time})` : ''}
            </div>
            <div className="flex items-center gap-2">
              Shift Fee: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(student.shifts?.fee || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            <p className="text-2xl font-bold">
              Total Due: {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(calculatedDue > 0 ? calculatedDue : 0)}
            </p>
            {libraryId && <ClientAddPaymentForm studentId={student.id} libraryId={libraryId} />} 
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>All recorded payments for {student.name}.</CardDescription>
        </CardHeader>
        <CardContent>
          <PaymentsList payments={student.payments || []} onPaymentDeleted={handlePaymentDeleted} />
        </CardContent>
      </Card>
    </div>
  );
}
