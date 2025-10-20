'use client';

import Link from 'next/link';
import { notFound, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar as CalendarIconLucid, Armchair, CalendarCheck2 } from 'lucide-react';
import PaymentsList from '@/components/payments/payments-list';
import ClientStudentActions from '@/components/students/client-student-actions';
import AddPaymentForm from '@/components/payments/add-payment-form';
import { format, isFuture } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
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
// --- MODIFICATION: Importing a more specific type ---
import type { StudentWithShift } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

// Create the Supabase client once, outside the component
const supabase = createClient();

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const studentId = params.id;

  const { user, isLoading: userLoading } = useUser();
  // --- MODIFICATION: Using the more specific type ---
  const [student, setStudent] = useState<StudentWithShift | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Renamed for clarity
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchStudentData = useCallback(async () => {
    if (!user) return;

    setLoadingStudent(true);
    setFetchError(null);

    // --- OPTIMIZATION: Removed `payments (*)` from the select query ---
    // This now only fetches the student and their shift details, making it much faster.
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        shifts (*)
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student:', studentError);
      setFetchError("Student not found or an error occurred.");
    } else {
      setStudent(studentData);
    }
    setLoadingStudent(false);
  }, [user, studentId]);

  useEffect(() => {
    if (!userLoading && user) {
      fetchStudentData();
    }
  }, [userLoading, user, fetchStudentData, refreshTrigger]);
  
  // This function will be called by child components to trigger a data refresh
  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (userLoading || loadingStudent) {
    return <StudentProfileSkeleton />;
  }

  if (fetchError) {
    return <p className="text-center text-red-500">Error: {fetchError}</p>;
  }

  if (!student) {
    notFound();
  }
  
  const isMembershipActive = student.membership_expiry_date ? isFuture(new Date(student.membership_expiry_date)) : false;
  const statusText = isMembershipActive ? 'Active' : 'Expired';

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem><BreadcrumbLink href="/dashboard/students">Students</BreadcrumbLink></BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem><BreadcrumbPage>{student.name}</BreadcrumbPage></BreadcrumbItem>
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
                        <Badge variant={isMembershipActive ? 'default' : 'destructive'} className={`mt-2 ${isMembershipActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {statusText}
                        </Badge>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Membership Status</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                         <div className="flex items-center gap-3">
                            <CalendarCheck2 className={`h-5 w-5 ${isMembershipActive ? 'text-green-600' : 'text-red-600'}`} />
                            <div>
                                <p className="text-sm text-muted-foreground">Expires on</p>
                                <p className="text-sm font-semibold">
                                    {student.membership_expiry_date ? format(new Date(student.membership_expiry_date), 'PPP') : 'Not Set'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                <Card>
                    <CardHeader>
                        <CardTitle>Library Details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <div className="flex items-center gap-3">
                            <CalendarIconLucid className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">Joined: {format(new Date(student.join_date), 'PPP')}</span>
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
                <AddPaymentForm 
                  libraryId={student.library_id}
                  studentId={student.id}
                  onPaymentSuccess={handleDataRefresh}
                />

                <Card>
                    <CardHeader>
                        <CardTitle>Payment History</CardTitle>
                        <CardDescription>A complete record of all payments for {student.name}.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* --- MODIFICATION: Pass studentId to make it self-sufficient --- */}
                        <PaymentsList studentId={student.id} onPaymentDeleted={handleDataRefresh} />
                    </CardContent>
                </Card>
            </div>
        </div>
    </div>
  );
}

const StudentProfileSkeleton = () => (
    <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 flex flex-col gap-6">
                <Card><CardContent className="pt-6 flex flex-col items-center"><Skeleton className="h-24 w-24 rounded-full mb-4" /><Skeleton className="h-8 w-40 mb-2" /><Skeleton className="h-6 w-20" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent className="grid gap-3"><Skeleton className="h-10 w-full" /></CardContent></Card>
                <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="grid gap-4"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
            </div>
            <div className="md:col-span-2 flex flex-col gap-6">
                <Skeleton className="h-96 w-full" />
                <Card><CardHeader><Skeleton className="h-6 w-40 mb-2" /><Skeleton className="h-4 w-56" /></CardHeader><CardContent><Skeleton className="h-40 w-full" /></CardContent></Card>
            </div>
        </div>
    </div>
);