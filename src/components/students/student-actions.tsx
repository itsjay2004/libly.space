"use client"

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Student, Shift } from "@/lib/types";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useUser } from "@/hooks/use-user";
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { checkOverlap } from '@/lib/time-utils';

export default function StudentActions({ student, onActionComplete }: { student?: Student, onActionComplete?: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const { isStudentLimitReached, isSubscriptionExpired } = useUser();

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: libraryData } = await supabase
          .from('libraries')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (libraryData) {
          setLibraryId(libraryData.id);
          const { data: shiftsData } = await supabase
            .from('shifts')
            .select('*')
            .eq('library_id', libraryData.id);
          if (shiftsData) setShifts(shiftsData);
        }
      }
    };
    getInitialData();
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!student && (isStudentLimitReached || isSubscriptionExpired)) {
      toast({
        title: "Cannot Add Student",
        description: isStudentLimitReached
          ? "You have reached your student limit. Please upgrade your plan."
          : "Your subscription has expired. Please renew to add new students.",
        variant: "destructive",
      });
      setOpen(false);
      return;
    }

    if (!libraryId) {
        toast({ title: "Error", description: "Could not find library.", variant: "destructive"});
        return;
    }

    const formData = new FormData(event.currentTarget);
    const seatNumber = formData.get('seat_number') ? Number(formData.get('seat_number')) : null;
    const shiftId = formData.get('shift_id') as string;

    if (seatNumber) { 
      const { data: currentStudents, error: fetchStudentsError } = await supabase
        .from('students')
        .select('id, shift_id, seat_number, shifts(start_time, end_time)')
        .eq('library_id', libraryId);

      if (fetchStudentsError) {
        toast({ title: "Error fetching student data", description: fetchStudentsError.message, variant: "destructive" });
        return;
      }

      const { data: latestShifts, error: fetchShiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('library_id', libraryId);

      if (fetchShiftsError) {
        toast({ title: "Error fetching shifts data", description: fetchShiftsError.message, variant: "destructive" });
        return;
      }
      
      const selectedShiftDetails = latestShifts.find(s => s.id === shiftId);
      if (shiftId && !selectedShiftDetails) {
        toast({ title: "Error", description: "Selected shift details not found.", variant: "destructive" });
        return;
      }

      const isSeatUnavailableDueToOverlap = currentStudents.some(existingStudent => {
        if (student && existingStudent.id === student.id) {
          return false; // Don't check against the student being edited
        }
        
        if (existingStudent.seat_number === seatNumber) {
          if (!shiftId || !existingStudent.shift_id) return true;
          
          const existingStudentShiftDetails = latestShifts.find(s => s.id === existingStudent.shift_id);
          if (!selectedShiftDetails || !existingStudentShiftDetails) return true;

          return checkOverlap(
            selectedShiftDetails.start_time,
            selectedShiftDetails.end_time,
            existingStudentShiftDetails.start_time,
            existingStudentShiftDetails.end_time
          );
        }
        return false;
      });

      if (isSeatUnavailableDueToOverlap) {
        toast({
          variant: 'destructive',
          title: "Seat Unavailable",
          description: `Seat #${seatNumber} is already occupied by another student during an overlapping shift.`,
        });
        return;
      }
    }

    const studentData = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string || null,
        gender: formData.get('gender') as string || null,
        shift_id: shiftId,
        seat_number: seatNumber,
        id_number: formData.get('id_number') as string || null,
        join_date: formData.get('join_date') ? new Date(formData.get('join_date') as string).toISOString() : new Date().toISOString(),
    };

    const { error } = student
        ? await supabase.from('students').update(studentData).eq('id', student.id)
        : await supabase.from('students').insert({ ...studentData, library_id: libraryId });

    if (error) {
        toast({ title: "Error saving student", description: error.message, variant: "destructive" });
    } else {
        toast({
          title: student ? "Student Updated" : "Student Added",
          description: `${studentData.name} has been successfully ${student ? 'updated' : 'added'}.`,
        });
        setOpen(false);
        onActionComplete?.();
    }
  };

  const handleDelete = async () => {
    if (!student) return;
    const { error } = await supabase.from('students').delete().eq('id', student.id);
    if (error) {
      toast({ title: "Error deleting student", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Student Deleted", description: `${student.name} has been successfully deleted.` });
      setIsDeleteDialogOpen(false);
      router.push('/dashboard/students');
    }
  };

  const formContent = (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        <DialogDescription>{student ? "Update the student's details." : "Fill in the details for the new student."}</DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">Name</Label>
          <Input id="name" name="name" defaultValue={student?.name} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="phone" className="text-right">Phone</Label>
          <Input id="phone" name="phone" type="tel" defaultValue={student?.phone} className="col-span-3" required pattern="[0-9]{10}" title="Phone number must be 10 digits" />
        </div>
         <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="gender" className="text-right">Gender</Label>
          <Select name="gender" defaultValue={student?.gender ?? undefined}>
            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label htmlFor="address" className="text-right pt-2">Address</Label>
          <Textarea id="address" name="address" defaultValue={student?.address ?? ''} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="id_number" className="text-right">ID Number</Label>
          <Input id="id_number" name="id_number" defaultValue={student?.id_number ?? ''} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shift_id" className="text-right">Shift</Label>
          <Select name="shift_id" defaultValue={student?.shift_id ?? undefined} required>
            <SelectTrigger className="col-span-3"><SelectValue placeholder="Select a shift" /></SelectTrigger>
            <SelectContent>
              {shifts.map(shift => (
                <SelectItem key={shift.id} value={shift.id!}>{shift.name} ({new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(shift.fee || 0)})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="seat_number" className="text-right">Seat No.</Label>
          <Input id="seat_number" name="seat_number" type="number" defaultValue={student?.seat_number ?? ''} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="join_date" className="text-right">Join Date</Label>
          <Input id="join_date" name="join_date" type="date" defaultValue={student?.join_date ? new Date(student.join_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]} className="col-span-3" />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit">Save changes</Button>
      </DialogFooter>
    </form>
  );

  if (student) {
    return (
      <>
        <Dialog open={open} onOpenChange={setOpen}>
          <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild><Link href={`/dashboard/students/${student.id}`}><Eye className="mr-2 h-4 w-4" /> View Details</Link></DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setOpen(true)}><Edit className="mr-2 h-4 w-4" /> Edit</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className="sm:max-w-[425px]">{formContent}</DialogContent>
        </Dialog>
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>Are you sure you want to delete {student.name}? This will also delete all associated payment records and cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const disableAddStudent = isStudentLimitReached || isSubscriptionExpired;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div style={{ display: 'inline-block', cursor: disableAddStudent ? 'not-allowed' : 'pointer' }}>
              <DialogTrigger asChild><Button disabled={disableAddStudent}><PlusCircle className="mr-2 h-4 w-4" /> Add Student</Button></DialogTrigger>
            </div>
          </TooltipTrigger>
          {disableAddStudent && (<TooltipContent>{isStudentLimitReached ? 'You have reached your student limit.' : 'Your subscription has expired.'}</TooltipContent>)}
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="sm:max-w-[425px]">{formContent}</DialogContent>
    </Dialog>
  );
}
