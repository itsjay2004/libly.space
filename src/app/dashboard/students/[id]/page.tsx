'use client';

import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar as CalendarIconLucid, Armchair, CalendarCheck2, Home, User } from 'lucide-react';
import PaymentsList from '@/components/payments/payments-list';
import ClientStudentActions from '@/components/students/client-student-actions';
import AddPaymentForm from '@/components/payments/add-payment-form';
import { format, isFuture } from 'date-fns';
import { useEffect, useState, useCallback } from 'react';
import { useSharedUser } from '@/contexts/UserContext'; 
import { Skeleton } from "@/components/ui/skeleton";
import { 
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import type { StudentWithShift, Library } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Helper function to format 24-hour time string to AM/PM format
const formatTime = (timeString: string | null): string => {
  if (!timeString) return 'N/A';
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

export default function StudentProfilePage({ params }: { params: { id: string } }) {
  const studentId = params.id;

  const { user, libraryId, isUserLoading } = useSharedUser();
  const [student, setStudent] = useState<StudentWithShift | null>(null);
  const [library, setLibrary] = useState<Library | null>(null);
  const [loadingStudent, setLoadingStudent] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
      document.title = `Student Profile - Libly Space`;
    }, [])

  const fetchStudentAndLibraryData = useCallback(async () => {
    if (!user || !libraryId) return;

    setLoadingStudent(true);
    setFetchError(null);

    // Fetch student data
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        shifts (*)
      `)
      .eq('id', studentId)
      .eq('library_id', libraryId) 
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student:', studentError);
      setFetchError("Student not found or an error occurred.");
      setLoadingStudent(false);
      return;
    }
    setStudent(studentData);

    // Fetch library data
    const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('*')
        .eq('id', libraryId)
        .single();
    
    if (libraryError || !libraryData) {
        console.error('Error fetching library details:', libraryError);
        // Continue without library name, or set a default
    } else {
        setLibrary(libraryData);
    }

    setLoadingStudent(false);
  }, [user, libraryId, studentId]); 

  useEffect(() => {
    if (!isUserLoading && user) {
        fetchStudentAndLibraryData();
    } else if (!isUserLoading && !user) {
        setLoadingStudent(false);
        setFetchError("Please log in to view student profiles.");
    }
  }, [isUserLoading, user, fetchStudentAndLibraryData, refreshTrigger]);
  
  const handleDataRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };
  
  if (isUserLoading || loadingStudent) {
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
  const libraryName = library?.name || 'Your Library';

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
            <ClientStudentActions student={student} onActionComplete={handleDataRefresh} />
        </div>

        <div className="grid gap-8 md:grid-cols-3">
            <div className="md:col-span-1 flex flex-col gap-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <Avatar className="h-24 w-24 mb-4">
                            <AvatarImage src={`https://api.dicebear.com/9.x/initials/svg?seed=${student.name}&backgroundColor=b6e3f4,d1d4f9,ffd5dc,c0aede&backgroundType=gradientLinear&fontFamily=Times%20New%20Roman&fontWeight=500`} alt={student.name} />
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
                        <CardTitle>Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        <div className="flex items-center gap-3">
                            <Phone className="h-5 w-5 text-muted-foreground" />
                            <span className="text-sm">{student.phone || 'N/A'}</span>
                        </div>
                        {student.address && (
                            <div className="flex items-start gap-3">
                                <Home className="h-5 w-5 text-muted-foreground mt-1" />
                                <span className="text-sm">{student.address}</span>
                            </div>
                        )}
                         {student.gender && (
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-muted-foreground" />
                                <span className="text-sm">{student.gender}</span>
                            </div>
                        )}
                        {student.id_number && (
                            <div className="flex items-center gap-3">
                                <p className='text-sm text-muted-foreground'>Aadhar No:</p>
                                <span className="text-sm">{student.id_number}</span>
                            </div>
                        )}
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
                            <span className="text-sm">{student.shifts?.name || 'N/A'} {student.shifts?.start_time && student.shifts?.end_time ? `(${formatTime(student.shifts.start_time)} - ${formatTime(student.shifts.end_time)})` : ''}</span>
                        </div>
                        <div className="flex items-center gap-3">
                             <p className='text-sm text-muted-foreground'>Shift Fee:</p>
                             <span className="text-sm">{new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(student.shifts?.fee || 0)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

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
                        <PaymentsList 
                            studentId={student.id}
                            studentName={student.name}
                            libraryName={libraryName}
                            onPaymentDeleted={handleDataRefresh}
                        />
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