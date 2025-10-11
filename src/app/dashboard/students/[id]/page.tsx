'use client';

import Link from 'next/link';
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
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const studentId = params.id;

  const { user, isLoading: userLoading, error: userError } = useUser();
  const [student, setStudent] = useState<any>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

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
  }, [user, userLoading, studentId, supabase, refreshTrigger]);

  if (userLoading || loadingStudent) {
    return (
        <div className="flex flex-col gap-6">
             <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                         <BreadcrumbLink href="/dashboard/students">Students</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>Details</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <div className="flex items-center justify-end">
                <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid gap-8 md:grid-cols-3">
                <div className="md:col-span-1 flex flex-col gap-6">
                    <Card>
                        <CardContent className="pt-6 flex flex-col items-center text-center">
                            <Skeleton className="h-24 w-24 rounded-full mb-4" />
                            <Skeleton className="h-8 w-40 mb-2" />
                            <Skeleton className="h-6 w-20" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                        </CardContent>
                    </Card>
                </div>
                <div className="md:col-span-2 flex flex-col gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <Skeleton className="h-12 w-1/2" />
                             <Skeleton className="h-10 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-40" /></CardTitle>
                            <CardDescription><Skeleton className="h-4 w-56" /></CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center p-2 border-b">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                                <div className="flex justify-between items-center p-2 border-b">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-16" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}


  if (userError || fetchError) {
    return <p className="text-center text-red-500">Error: {userError || fetchError}</p>;
  }

  if (!student) {
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
    router.refresh();
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/dashboard/students">Students</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>{student.name}</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>
            <ClientStudentActions student={student} />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
            {/* Left Column */}
            <div className="md:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt={student.name} />
                            <AvatarFallback>{student.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-2xl font-semibold">{student.name}</h2>
                        <Badge variant={student.status === 'active' ? 'default' : 'destructive'} className={`mt-2 ${student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {student.status}
                        </Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                         <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">{student.phone}</span>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Library Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Joined: {formattedJoinDate}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Armchair className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Seat No: {student.seat_number || 'N/A'}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <p className='text-sm text-muted-foreground'>Shift: </p>
                            <span className="text-sm">{student.shifts?.name || 'N/A'} {student.shifts?.start_time && student.shifts?.end_time ? `(${student.shifts.start_time} - ${student.shifts.end_time})` : ''}</span>
                        </div>
                         <div className="flex items-center gap-3">
                             <p className='text-sm text-muted-foreground'>Shift Fee:</p>
                             <span className="text-sm">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(student.shifts?.fee || 0)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Right Column */}
            <div className="md:col-span-2 flex flex-col gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className='border-b pb-4'>
                            <p className="text-sm text-muted-foreground mb-1">Total Due</p>
                            <p className="text-3xl font-bold text-red-600">
                                {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(calculatedDue > 0 ? calculatedDue : 0)}
                            </p>
                        </div>
                        <div>
                             {libraryId && <ClientAddPaymentForm studentId={student.id} libraryId={libraryId} />}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>A complete record of all payments for {student.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <PaymentsList payments={student.payments || []} onPaymentDeleted={handlePaymentDeleted} />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}
