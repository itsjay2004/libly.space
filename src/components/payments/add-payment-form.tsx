"use client";

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Student, Shift } from '@/lib/types';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';

// Main schema for the form
const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  paymentDate: z.date({ required_error: 'Please select a date.' }),
});

// Props for the unified component
interface AddPaymentFormProps {
  libraryId: string;
  studentId?: string; // Optional: if provided, the form is for a single student
  onPaymentSuccess?: () => void; // Optional: callback on success
}

export default function AddPaymentForm({ libraryId, studentId, onPaymentSuccess }: AddPaymentFormProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentShift, setStudentShift] = useState<Shift | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: studentId,
      amount: 0,
      paymentDate: new Date(),
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedStudentId = form.watch('studentId');

  // Effect to fetch all students if no specific studentId is provided
  useEffect(() => {
    if (!studentId) {
      setIsLoadingStudents(true);
      const fetchStudents = async () => {
        const { data, error } = await supabase
          .from('students')
          .select('id, name, phone')
          .eq('library_id', libraryId);
        if (error) {
          toast({ title: "Error fetching students", description: error.message, variant: "destructive" });
        } else {
          setStudents(data || []);
        }
        setIsLoadingStudents(false);
      };
      fetchStudents();
    }
  }, [libraryId, studentId, supabase, toast]);

  // Effect to fetch details of the selected student
  useEffect(() => {
    const fetchStudentAndShiftDetails = async () => {
      if (!watchedStudentId) {
        setSelectedStudent(null);
        setStudentShift(null)
        return;
      };

      const { data: studentData, error } = await supabase
        .from('students')
        .select('*, shifts(*)')
        .eq('id', watchedStudentId)
        .single();

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

  // Effect for real-time calculation of expiry date
  useEffect(() => {
    if (selectedStudent && studentShift && studentShift.fee && watchedAmount > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const currentExpiry = selectedStudent.membership_expiry_date
        ? new Date(selectedStudent.membership_expiry_date)
        : null;

      const sDate = currentExpiry && currentExpiry > today ? currentExpiry : today;
      setStartDate(sDate);

      const feePerDay = Number(studentShift.fee) / 30;
      if (feePerDay > 0) {
        const durationDays = Math.floor(watchedAmount / feePerDay);
        const newExpiryDate = addDays(sDate, durationDays);
        setExpiryDate(newExpiryDate);
      }
    } else {
      setStartDate(null);
      setExpiryDate(null);
    }
  }, [watchedAmount, selectedStudent, studentShift]);

  const onSubmit = async (values: z.infer<typeof paymentFormSchema>) => {
    if (!startDate || !expiryDate) {
      toast({ title: "Calculation Error", description: "Start or Expiry date could not be calculated.", variant: "destructive" });
      return;
    }

    // 1. Record the payment
    const { error: paymentError } = await supabase.from('payments').insert({
      student_id: values.studentId,
      library_id: libraryId,
      amount: values.amount,
      payment_date: values.paymentDate.toISOString().split('T')[0],
      membership_start_date: startDate.toISOString().split('T')[0],
      membership_end_date: expiryDate.toISOString().split('T')[0],
    });

    if (paymentError) {
      toast({ title: "Error Recording Payment", description: paymentError.message, variant: "destructive" });
      return;
    }

    // 2. Update the student's expiry date
    const { error: studentUpdateError } = await supabase
      .from('students')
      .update({ membership_expiry_date: expiryDate.toISOString().split('T')[0] })
      .eq('id', values.studentId);

    if (studentUpdateError) {
      toast({ title: "Error Updating Student Status", description: `Payment was recorded, but failed to update the student's expiry date. Please correct it manually. Error: ${studentUpdateError.message}`, variant: "destructive", duration: 7000 });
    } else {
      toast({
        title: 'Payment Recorded Successfully',
        description: `Membership for ${selectedStudent?.name} is now active until ${format(expiryDate, "PPP")}.`,
      });
      form.reset({ studentId: studentId || undefined, amount: 0, paymentDate: new Date() });
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a Payment</CardTitle>
        <CardDescription>Enter the amount paid to automatically calculate the membership expiry.</CardDescription>
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
                        <FormControl>
                          <Button variant="outline" role="combobox" className={cn("w-full justify-between", !field.value && "text-muted-foreground")}>
                            {field.value ? students.find((s) => s.id === field.value)?.name : "Select a student"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search student..." />
                          <CommandList>
                            <CommandEmpty>{isLoadingStudents ? 'Loading students...' : 'No student found.'}</CommandEmpty>
                            <CommandGroup>
                              {students.map((s) => (
                                <CommandItem value={s.name} key={s.id} onSelect={() => form.setValue("studentId", s.id, { shouldValidate: true })}>
                                  <Check className={cn("mr-2 h-4 w-4", s.id === field.value ? "opacity-100" : "opacity-0")}/>
                                  <div><p>{s.name}</p><p className="text-xs text-muted-foreground">{s.phone}</p></div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
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
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
                <FormItem>
                    <FormLabel>Membership Start Date</FormLabel>
                    <Input type="text" readOnly value={startDate ? format(startDate, 'PPP') : '...'} className="font-medium" />
                </FormItem>
                <FormItem>
                    <FormLabel>New Expiry Date</FormLabel>
                    <Input type="text" readOnly value={expiryDate ? format(expiryDate, 'PPP') : '...'} className="font-medium"/>
                </FormItem>
            </div>

            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={!expiryDate || form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Recording...' : 'Record Payment'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
