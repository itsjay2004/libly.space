'use client';

import {
  useEffect,
  useState,
  useMemo
} from 'react';
import { createClient } from '@/lib/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/hooks/use-user';
import { startOfMonth, endOfMonth, differenceInDays, getDaysInMonth, addMonths, isSameMonth, format } from 'date-fns';
import { Input } from '@/components/ui/input';

interface Due {
  student_id: string;
  student_name: string;
  student_phone: string;
  due_amount: number;
  for_month: string;
}

export default function DuesList() {
  const { user, isLoading: userLoading } = useUser();
  const [allDues, setAllDues] = useState < Due[] > ([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const supabase = createClient();
  const PAGE_SIZE = 10;

  useEffect(() => {
    const fetchDues = async () => {
      if (!user) return;
      setLoading(true);

      const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('id')
        .eq('owner_id', user.id)
        .single();

      if (libraryError || !libraryData) {
        console.error('Error fetching library:', libraryError);
        setLoading(false);
        return;
      }

      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id,
          name,
          phone,
          join_date,
          status,
          shift_id,
          shifts ( fee ),
          payments ( amount, for_month )
        `)
        .eq('library_id', libraryData.id)
        .eq('status', 'active');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        setLoading(false);
        return;
      }

      const calculatedDues: Due[] = [];
      const today = new Date();

      students.forEach(student => {
        const monthlyFee = student.shifts?.fee || 0;
        if (monthlyFee === 0) return;

        const studentJoinDate = new Date(student.join_date);
        let monthIterator = startOfMonth(studentJoinDate);

        const studentPaymentsByMonth: { [key: string]: number } = {};
        student.payments.forEach((p: any) => {
            studentPaymentsByMonth[p.for_month] = (studentPaymentsByMonth[p.for_month] || 0) + p.amount;
        });

        while (monthIterator <= today) {
          const monthString = format(monthIterator, "MMMM yyyy");
          const paidForMonth = studentPaymentsByMonth[monthString] || 0;
          let expectedFee = monthlyFee;

          if (isSameMonth(monthIterator, studentJoinDate) && isSameMonth(monthIterator, today)) {
            const daysInMonth = getDaysInMonth(studentJoinDate);
            const activeDays = differenceInDays(today, studentJoinDate) + 1;
            expectedFee = (monthlyFee / daysInMonth) * activeDays;
          } else if (isSameMonth(monthIterator, studentJoinDate)) {
            const daysInMonth = getDaysInMonth(studentJoinDate);
            const activeDays = differenceInDays(endOfMonth(studentJoinDate), studentJoinDate) + 1;
            expectedFee = (monthlyFee / daysInMonth) * activeDays;
          } else if (isSameMonth(monthIterator, today)) {
            const daysInMonth = getDaysInMonth(today);
            const activeDays = differenceInDays(today, startOfMonth(today)) + 1;
            expectedFee = (monthlyFee / daysInMonth) * activeDays;
          }

          const dueForMonth = expectedFee - paidForMonth;

          if (dueForMonth > 1) { // Threshold to avoid floating point inaccuracies
            calculatedDues.push({
              student_id: student.id,
              student_name: student.name,
              student_phone: student.phone,
              due_amount: dueForMonth,
              for_month: monthString,
            });
          }

          monthIterator = addMonths(monthIterator, 1);
        }
      });

      setAllDues(calculatedDues);
      setLoading(false);
    };

    if (!userLoading) {
      fetchDues();
    }
  }, [user, userLoading, supabase]);

  const filteredAndSortedDues = useMemo(() => {
    return allDues
      .filter(due =>
        due.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        due.student_phone.includes(searchQuery)
      )
      .sort((a, b) => b.due_amount - a.due_amount);
  }, [allDues, searchQuery]);

  const paginatedDues = useMemo(() => {
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = startIndex + PAGE_SIZE;
    return filteredAndSortedDues.slice(startIndex, endIndex);
  }, [filteredAndSortedDues, page]);

  const hasMore = useMemo(() => {
    return page * PAGE_SIZE < filteredAndSortedDues.length;
  }, [filteredAndSortedDues, page]);


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Dues</CardTitle>
          <CardDescription>A list of all pending dues from students.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            <Skeleton className='h-10 w-full mb-4' />
            <div className='flex justify-between items-center p-2 border-b'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='flex justify-between items-center p-2 border-b'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Outstanding Dues</CardTitle>
        <CardDescription>A list of all pending dues from students.</CardDescription>
      </CardHeader>
      <CardContent>
        <Input
          placeholder='Search by name or phone...'
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1); // Reset to first page on new search
          }}
          className='mb-4'
        />
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Month</TableHead>
              <TableHead className='text-right'>Amount Due</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDues.length > 0 ? (
              paginatedDues.map((due, index) => (
                <TableRow key={`${due.student_id}-${due.for_month}-${index}`}>
                  <TableCell>{due.student_name}</TableCell>
                  <TableCell>{due.student_phone}</TableCell>
                  <TableCell>{due.for_month}</TableCell>
                  <TableCell className='text-right'>
                    {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(due.due_amount)}
                  </TableCell>
                </TableRow>
              )))
             : (
              <TableRow>
                <TableCell colSpan={4} className='text-center'>
                  No outstanding dues matching your search.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className='flex justify-between items-center mt-4'>
          <Button onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
          <span className='bg-zinc-700 px-2 py-1 rounded-md text-sm'>Page {page}</span>
          <Button onClick={() => setPage(p => p + 1)} disabled={!hasMore}>Next</Button>
        </div>
      </CardContent>
    </Card>
  );
}
