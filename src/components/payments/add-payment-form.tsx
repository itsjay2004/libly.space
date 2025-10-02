"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { students } from '@/lib/data';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon, Check, ChevronsUpDown } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from '../ui/badge';
import React from 'react';

const months = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);


const paymentFormSchema = z.object({
  studentId: z.string({ required_error: 'Please select a student.' }),
  amount: z.coerce.number().min(1, 'Amount must be greater than 0.'),
  date: z.date({ required_error: 'Please select a date.' }),
  year: z.coerce.number(),
  months: z.array(z.string()).min(1, { message: "Please select at least one month."}),
});

export default function AddPaymentForm() {
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof paymentFormSchema>>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: 0,
      date: new Date(),
      months: [],
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = (values: z.infer<typeof paymentFormSchema>) => {
    // In a real app, you would handle the payment logic here
    // (e.g., update student's due amount, add to payments list)
    const paymentPayload = {
      ...values,
      months: values.months.map(month => `${month} ${values.year}`)
    }
    console.log(paymentPayload);
    const student = students.find(s => s.id === values.studentId);
    toast({
      title: 'Payment Recorded',
      description: `Payment of ₹${values.amount} for ${student?.name} for ${values.months.join(', ')} ${values.year} has been recorded.`,
    });
    form.reset({ amount: 0, date: new Date(), months: [], year: new Date().getFullYear() });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record a Payment</CardTitle>
        <CardDescription>Select a student and enter the amount paid.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Student</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "w-full justify-between",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value
                            ? students.find(
                                (student) => student.id === field.value
                              )?.name
                            : "Select a student"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search student..." />
                        <CommandList>
                          <CommandEmpty>No student found.</CommandEmpty>
                          <CommandGroup>
                            {students.map((student) => (
                              <CommandItem
                                value={student.name}
                                key={student.id}
                                onSelect={() => {
                                  form.setValue("studentId", student.id)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    student.id === field.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                <div>
                                  <p>{student.name}</p>
                                  <p className="text-xs text-muted-foreground">{student.phone}</p>
                                </div>
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

            <div className="grid grid-cols-3 gap-4">
               <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel>Year</FormLabel>
                     <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={String(field.value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {years.map(year => (
                            <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="months"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Month(s)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between h-auto",
                              !field.value?.length && "text-muted-foreground"
                            )}
                          >
                              <div className="flex gap-1 flex-wrap">
                              {field.value?.length > 0 ? field.value.map(month => (
                                  <Badge key={month} variant="secondary" className="mr-1">{month}</Badge>
                              )) : "Select month(s)"}
                              </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                          <CommandInput placeholder="Search months..." />
                          <CommandList>
                            <CommandEmpty>No months found.</CommandEmpty>
                            <CommandGroup>
                              {months.map((month) => {
                                const isSelected = field.value.includes(month);
                                return (
                                  <CommandItem
                                      key={month}
                                      value={month}
                                      onSelect={() => {
                                          if (isSelected) {
                                              field.onChange(field.value.filter((m) => m !== month));
                                          } else {
                                              field.onChange([...field.value, month]);
                                          }
                                      }}
                                  >
                                      <Check
                                      className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected ? "opacity-100" : "opacity-0"
                                      )}
                                      />
                                      {month}
                                  </CommandItem>
                                )
                              })}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} onChange={event => field.onChange(+event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date("1900-01-01")
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">Record Payment</Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
