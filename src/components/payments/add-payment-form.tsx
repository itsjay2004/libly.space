"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Student, Shift } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Check, ChevronsUpDown, CalendarDays, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays, isFuture } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Separator } from '@/components/ui/separator';

const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  payment_method: z.string({ required_error: 'Please select a payment method.' }),
});

interface AddPaymentFormProps {
  libraryId: string;
  studentId?: string;
  onPaymentSuccess?: () => void;
}

export default function AddPaymentForm({ libraryId, studentId, onPaymentSuccess }: AddPaymentFormProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentShift, setStudentShift] = useState<Shift | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: studentId,
      amount: undefined,
      payment_method: 'Cash',
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedStudentId = form.watch('studentId');

  useEffect(() => {
    if (!studentId) {
      setIsLoadingStudents(true);
      const fetchStudents = async () => {
        const { data, error } = await supabase.from('students').select('id, name, phone').eq('library_id', libraryId);
        if (error) toast({ title: "Error fetching students", description: error.message, variant: "destructive" });
        else setStudents(data || []);
        setIsLoadingStudents(false);
      };
      fetchStudents();
    }
  }, [libraryId, studentId, supabase, toast]);

  useEffect(() => {
    const fetchStudentAndShiftDetails = async () => {
      if (!watchedStudentId) {
        setSelectedStudent(null);
        setStudentShift(null);
        return;
      }
      const { data: studentData, error } = await supabase.from('students').select('*, shifts(*)').eq('id', watchedStudentId).single();
      if (error) {
        toast({ title: "Error fetching student details", description: error.message, variant: "destructive" });
        setSelectedStudent(null);
        setStudentShift(null);
      } else {
        setSelectedStudent(studentData);
        setStudentShift(studentData.shifts);
      }
    };
    fetchStudentAndShiftDetails();
  }, [watchedStudentId, supabase, toast]);

  const { startDate, expiryDate } = useMemo(() => {
    if (!selectedStudent || !studentShift?.fee) return { startDate: null, expiryDate: null };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentExpiry = selectedStudent.membership_expiry_date ? new Date(selectedStudent.membership_expiry_date) : null;
    const sDate = currentExpiry && isFuture(currentExpiry) ? currentExpiry : today;

    if (watchedAmount > 0) {
      const feePerDay = Number(studentShift.fee) / 30;
      if (feePerDay > 0) {
        const durationDays = Math.floor(watchedAmount / feePerDay);
        const newExpiryDate = addDays(sDate, durationDays);
        return { startDate: sDate, expiryDate: newExpiryDate };
      }
    }
    return { startDate: sDate, expiryDate: null };
  }, [watchedAmount, selectedStudent, studentShift]);

  const onSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!startDate || !expiryDate) {
      toast({ title: "Calculation Error", description: "Start or Expiry date could not be calculated.", variant: "destructive" });
      return;
    }
    
    const todayStr = new Date().toISOString().split('T')[0];

    const { error: paymentError } = await supabase.from('payments').insert({
      student_id: values.studentId,
      library_id: libraryId,
      amount: values.amount,
      payment_date: todayStr,
      payment_method: values.payment_method,
      membership_start_date: startDate.toISOString().split('T')[0],
      membership_end_date: expiryDate.toISOString().split('T')[0],
    });
    if (paymentError) {
      toast({ title: "Error Recording Payment", description: paymentError.message, variant: "destructive" });
      return;
    }

    const { error: studentUpdateError } = await supabase.from('students').update({ membership_expiry_date: expiryDate.toISOString().split('T')[0] }).eq('id', values.studentId);
    if (studentUpdateError) {
      toast({ title: "Error Updating Student Status", description: `Payment was recorded, but failed to update student's expiry. Please correct manually. Error: ${studentUpdateError.message}`, variant: "destructive", duration: 7000 });
    } else {
      toast({
        title: 'Payment Recorded Successfully',
        description: `Membership for ${selectedStudent?.name} is now active until ${format(expiryDate, "PPP")}.`,
      });
      form.reset({ studentId: studentId, amount: undefined, payment_method: "Cash" });
      onPaymentSuccess?.();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a Payment</CardTitle>
        <CardDescription>Enter amount to calculate membership extension.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {!studentId && (
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl><Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>{field.value ? students.find((s) => s.id === field.value)?.name : "Select a student"}<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" /></Button></FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command><CommandInput placeholder="Search student..." /><CommandList><CommandEmpty>{isLoadingStudents ? 'Loading...' : 'No student found.'}</CommandEmpty><CommandGroup>
                          {students.map((s) => (<CommandItem value={s.name} key={s.id} onSelect={() => form.setValue("studentId", s.id, { shouldValidate: true })}><Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")}/><div><p>{s.name}</p><p className="text-xs text-muted-foreground">{s.phone}</p></div></CommandItem>))}
                        </CommandGroup></CommandList></Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Paid</FormLabel>
                  <FormControl><Input type="number" placeholder="e.g., 500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="UPI">UPI</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Card">Card</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {selectedStudent && (
                 <Card className="bg-muted/50">
                    <CardHeader className="pb-4"><CardTitle className="text-base">Membership Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                        {studentShift?.fee && (
                            <div className="flex justify-between items-center text-sm">
                                <p className="text-muted-foreground">Shift Fee (Monthly)</p>
                                <p className="font-medium">₹{Number(studentShift.fee).toLocaleString()}</p>
                            </div>
                        )}
                        <div className="flex justify-between items-center text-sm">
                            <p className="text-muted-foreground">Current Expiry</p>
                            <p className="font-medium">{selectedStudent.membership_expiry_date ? format(new Date(selectedStudent.membership_expiry_date), 'PPP') : 'N/A'}</p>
                        </div>

                        <Separator />

                        <div className="flex justify-between items-center text-sm font-semibold">
                            <div className='text-center'>
                                <p className="text-xs text-muted-foreground font-normal">Starts On</p>
                                {startDate ? format(startDate, 'PPP') : '-'}
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                             <div className='text-center text-green-600'>
                                <p className="text-xs text-muted-foreground font-normal">New Expiry Date</p>
                                {expiryDate ? format(expiryDate, 'PPP') : '-'}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <p className="text-xs text-center text-muted-foreground pt-2 flex items-center justify-center gap-2">
                <CalendarDays className="h-4 w-4" />
                <span>Payment date: <strong>{format(new Date(), 'PPP')}</strong></span>
            </p>

            <Button type="submit" className="w-full" disabled={!expiryDate || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
