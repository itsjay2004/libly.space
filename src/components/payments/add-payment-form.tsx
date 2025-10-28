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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DatePicker } from '../ui/date-picker';
import LoadingSpinner from '../ui/loading-spinner';

const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  payment_method: z.string({ required_error: 'Please select a payment method.' }),
  startDate: z.date({ required_error: 'Please select a start date.' }),
});

interface AddPaymentFormProps {
  libraryId: string;
  studentId?: string;
  onPaymentSuccess?: () => void;
}

export default function AddPaymentForm({ libraryId, studentId, onPaymentSuccess }: AddPaymentFormProps) {
  const { toast } = useToast();
  const supabase = createClient();
  const queryClient = useQueryClient();

  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      studentId: studentId,
      amount: undefined,
      payment_method: 'Cash',
      startDate: undefined,
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedStudentId = form.watch('studentId');
  const watchedStartDate = form.watch('startDate');

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  const [popoverOpen, setPopoverOpen] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.length >= 2) {
        setDebouncedSearchTerm(searchTerm);
      } else {
        setDebouncedSearchTerm('');
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Query to fetch students based on search term (if studentId is not pre-selected)
  const { data: searchedStudents = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: ['students', libraryId, debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm) return [];
      const { data, error } = await supabase.from('students')
        .select('id, name, phone')
        .eq('library_id', libraryId)
        .ilike('name', `%${debouncedSearchTerm}%`)
        .limit(5);
      if (error) throw error;
      return data || [];
    },
    enabled: !studentId && debouncedSearchTerm.length >= 2,
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 5,
  });

  // Query to fetch details for a specific student and their shift
  const { data: selectedStudentDetails, isLoading: isLoadingStudentDetails } = useQuery<Student & { shifts: Shift | null }>({
    queryKey: ['studentDetails', watchedStudentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*, shifts(*)').eq('id', watchedStudentId).single();
      if (error) throw error;
      return data as Student & { shifts: Shift | null };
    },
    enabled: !!watchedStudentId,
    staleTime: 1000 * 60 * 5,
  });

  const selectedStudent = selectedStudentDetails;
  const studentShift = selectedStudentDetails?.shifts || null;

  useEffect(() => {
    if (studentId) {
      form.setValue('studentId', studentId);
    }
  }, [studentId, form]);

  useEffect(() => {
    if (selectedStudent) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const currentExpiry = selectedStudent.membership_expiry_date ? new Date(selectedStudent.membership_expiry_date) : null;
      const sDate = currentExpiry && isFuture(currentExpiry) ? currentExpiry : today;
      form.setValue('startDate', sDate);
      setSearchTerm(selectedStudent.name);
    }
  }, [selectedStudent, form.setValue]);

  const { expiryDate } = useMemo(() => {
    if (!studentShift?.fee) return { expiryDate: null };

    if (watchedAmount && watchedAmount > 0) {
      const feePerDay = Number(studentShift.fee) / 30;
      if (feePerDay > 0) {
        const durationDays = Math.floor(watchedAmount / feePerDay);
        const newExpiryDate = addDays(watchedStartDate, durationDays);
        return { expiryDate: newExpiryDate };
      }
    }
    return { expiryDate: null };
  }, [watchedAmount, watchedStartDate, studentShift]);

  const addPaymentMutation = useMutation({
    mutationFn: async (values: z.infer<typeof paymentFormSchema>) => {
      if (!watchedStartDate || !expiryDate) {
        throw new Error("Calculation Error: Start or Expiry date could not be calculated.");
      }

      const todayStr = new Date().toISOString().split('T')[0];

      const { error: paymentError } = await supabase.from('payments').insert({
        student_id: values.studentId,
        library_id: libraryId,
        amount: values.amount,
        payment_date: todayStr,
        payment_method: values.payment_method,
        membership_start_date: watchedStartDate.toISOString().split('T')[0],
        membership_end_date: expiryDate.toISOString().split('T')[0],
      });
      if (paymentError) {
        throw paymentError;
      }

      const { error: studentUpdateError } = await supabase.from('students').update({ membership_expiry_date: expiryDate.toISOString().split('T')[0] }).eq('id', values.studentId);
      if (studentUpdateError) {
        throw new Error(`Payment was recorded, but failed to update student's expiry. Please correct manually. Error: ${studentUpdateError.message}`);
      }
    },
    onSuccess: (_, variables) => {
      toast({
        title: 'Payment Recorded Successfully',
        description: `Membership for ${selectedStudent?.name} is now active until ${format(expiryDate!, "PPP")}.`,
      });
      form.reset({ studentId: studentId, amount: undefined, payment_method: "Cash" });
      onPaymentSuccess?.();

      queryClient.invalidateQueries({ queryKey: ['studentCount', libraryId] });
      queryClient.invalidateQueries({ queryKey: ['allPayments', libraryId] });
      queryClient.invalidateQueries({ queryKey: ['studentDetails', variables.studentId] });
      queryClient.invalidateQueries({ queryKey: ['students', libraryId] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats', libraryId] });
    },
    onError: (error: any) => {
      toast({ title: "Error Recording Payment", description: error.message, variant: "destructive", duration: 7000 });
    }
  });

  const onSubmit = (values: z.infer<typeof paymentFormSchema>) => {
    addPaymentMutation.mutate(values);
  };

  const displayStudents = studentId ? (selectedStudent ? [selectedStudent] : []) : searchedStudents;
  const displayLoadingStudents = studentId ? isLoadingStudentDetails : (isLoadingStudents && debouncedSearchTerm.length >= 2);

  return (
    <div className=''>
      <Card className="border border-gray-200 dark:border-gray-800">
        <CardHeader className="pb-4 sm:pb-6">
          <CardTitle className="text-lg sm:text-xl text-gray-900 dark:text-gray-100">
            Record a Payment
          </CardTitle>
          <CardDescription className="hidden sm:block text-sm sm:text-base">
            Enter amount to calculate membership extension.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
              {/* Student Selection Field */}
              {!studentId && (
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm sm:text-base">Student</FormLabel>
                      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              role="combobox"
                              className={cn(
                                "w-full justify-between text-left font-normal h-11 sm:h-10",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <span className="truncate">
                                {field.value ? displayStudents.find((s) => s.id === field.value)?.name : "Select a student"}
                              </span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-[var(--radix-popover-trigger-width)] p-0 sm:min-w-[300px]"
                          align="start"
                        >
                          <Command>
                            <CommandInput
                              placeholder="Search student..."
                              value={searchTerm}
                              onValueChange={setSearchTerm}
                              className="h-11 sm:h-9"
                            />
                            <CommandList>
                              {displayLoadingStudents ? (
                                <div className="p-4 text-center">
                                  <LoadingSpinner />
                                </div>
                              ) : (
                                <>
                                  <CommandEmpty className="py-6 text-center text-sm">
                                    {searchTerm.length >= 2 ? 'No student found.' : 'Type at least 2 characters to search.'}
                                  </CommandEmpty>
                                  <CommandGroup>
                                    {displayStudents.map((s) => (
                                      <CommandItem
                                        value={s.name}
                                        key={s.id}
                                        onSelect={() => {
                                          form.setValue("studentId", s.id, { shouldValidate: true });
                                          setSearchTerm(s.name);
                                          setDebouncedSearchTerm('');
                                          setPopoverOpen(false);
                                        }}
                                        className="py-3 sm:py-2"
                                      >
                                        <Check className={cn(
                                          "mr-2 h-4 w-4 flex-shrink-0",
                                          s.id === field.value ? "opacity-100" : "opacity-0"
                                        )} />
                                        <div className="flex flex-col min-w-0">
                                          <p className="truncate text-sm font-medium">{s.name}</p>
                                          <p className="text-xs text-muted-foreground truncate">{s.phone}</p>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </>
                              )}
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Amount Field */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Amount Paid</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 500"
                        {...field}
                        className="h-11 sm:h-10 text-sm sm:text-base"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Payment Method Field */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm sm:text-base">Payment Method</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-11 sm:h-10 text-sm sm:text-base">
                          <SelectValue placeholder="Select a payment method" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="UPI" className="text-sm">UPI</SelectItem>
                        <SelectItem value="Cash" className="text-sm">Cash</SelectItem>
                        <SelectItem value="Card" className="text-sm">Card</SelectItem>
                        <SelectItem value="Other" className="text-sm">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Start Date Field */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="text-sm sm:text-base">Starts On</FormLabel>
                    <DatePicker value={field.value} onChange={field.onChange} />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Membership Summary Card */}
              {selectedStudent && (
                <Card className="bg-muted/50 dark:bg-muted/20 border border-gray-200 dark:border-gray-700">
                  <CardHeader className="pb-3 sm:pb-4">
                    <CardTitle className="text-base sm:text-lg text-gray-900 dark:text-gray-100">
                      Membership Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    {studentShift?.fee && (
                      <div className="flex justify-between items-center text-sm">
                        <p className="text-muted-foreground">Shift Fee (Monthly)</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          ₹{Number(studentShift.fee).toLocaleString()}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm">
                      <p className="text-muted-foreground">Current Expiry</p>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {selectedStudent.membership_expiry_date ?
                          format(new Date(selectedStudent.membership_expiry_date), 'PPP') : 'N/A'
                        }
                      </p>
                    </div>

                    <Separator className="bg-gray-200 dark:bg-gray-700" />

                    <div className="flex justify-between items-center text-sm font-semibold">
                      <div className='text-center flex-1'>
                        <p className="text-xs text-muted-foreground font-normal mb-1">Starts On</p>
                        <p className="text-gray-900 dark:text-gray-100 text-xs sm:text-sm">
                          {watchedStartDate ? format(watchedStartDate, 'PPP') : '-'}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-2 flex-shrink-0" />
                      <div className='text-center flex-1 text-green-600 dark:text-green-400'>
                        <p className="text-xs text-muted-foreground font-normal mb-1">New Expiry Date</p>
                        <p className="text-xs sm:text-sm">
                          {expiryDate ? format(expiryDate, 'PPP') : '-'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Payment Date Info */}
              <p className="text-xs text-center text-muted-foreground pt-2 flex items-center justify-center gap-2 flex-wrap">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <span>Payment date: <strong>{format(new Date(), 'PPP')}</strong></span>
              </p>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-11 sm:h-10 text-sm sm:text-base font-medium"
                disabled={!expiryDate || addPaymentMutation.isPending}
              >
                {addPaymentMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <LoadingSpinner />
                    Recording...
                  </span>
                ) : (
                  'Record Payment'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}