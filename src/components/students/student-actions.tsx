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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Student, Shift } from "@/lib/types";
import { PlusCircle, Edit, Trash2, MoreHorizontal, Eye, UserCheck, UserX } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { User } from "@supabase/supabase-js";
import { checkOverlap } from '@/lib/time-utils';

export default function StudentActions({ student, onActionComplete }: { student?: Student, onActionComplete?: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<Shift[]>([]); 

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: libraryData } = await supabase
          .from('libraries')
          .select('id')
          .eq('owner_id', user.id)
          .single();

        if (libraryData) {
          setLibraryId(libraryData.id);
          const { data: shiftsData, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('library_id', libraryData.id);
          if (shiftsData) {
            setShifts(shiftsData);
          }
          if (shiftsError) {
            console.error("Error fetching shifts in StudentActions:", shiftsError);
            toast({ title: "Error", description: "Could not load shifts.", variant: "destructive" });
          }
        }
      }
    };
    getInitialData();
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!libraryId) {
        toast({ title: "Error", description: "Could not find library.", variant: "destructive"});
        return;
    }

    const formData = new FormData(event.currentTarget);
    const seatNumber = formData.get('seat_number') ? Number(formData.get('seat_number')) : null;
    const shiftId = formData.get('shift_id') as string;

    if (seatNumber) { // Check if a seat number is being assigned or updated
      // Fetch latest students and shifts for a fresh check
      const { data: currentStudents, error: fetchStudentsError } = await supabase
        .from('students')
        .select('id, name, shift_id, seat_number, shifts(start_time, end_time)')
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

      // Get shift details for the student being added/edited
      const selectedShiftDetails = latestShifts.find(s => s.id === shiftId);
      if (shiftId && !selectedShiftDetails) { // If a shiftId is provided but details aren't found, it's an error.
        toast({ title: "Error", description: "Selected shift details not found.", variant: "destructive" });
        return;
      }

      const isSeatUnavailableDueToOverlap = currentStudents.some(existingStudent => {
        // Exclude the current student being edited if they are already in this seat
        if (student && existingStudent.id === student.id && existingStudent.seat_number === seatNumber) {
          return false;
        }
        
        // If another student is in the selected seat
        if (existingStudent.seat_number === seatNumber) {
          // Case 1: The new assignment has no shift, and the existing student has no shift
          if (!shiftId && !existingStudent.shift_id) {
            return true; // Direct conflict: both unshifted, implying full occupancy.
          }
          // Case 2: The new assignment has no shift, and the existing student has a shift
          if (!shiftId && existingStudent.shift_id) {
            return true; // Direct conflict: new unshifted, existing shifted. Unshifted implies full occupancy.
          }
          // Case 3: The new assignment has a shift, and the existing student has no shift
          if (shiftId && !existingStudent.shift_id) {
            return true; // Direct conflict: new shifted, existing unshifted. Unshifted implies full occupancy.
          }

          // Case 4: Both the new assignment and the existing student have a shiftId.
          // Retrieve shift details for the existing student in the seat.
          const existingStudentShiftDetails = latestShifts.find(s => s.id === existingStudent.shift_id);

          // If either selectedShiftDetails or existingStudentShiftDetails are missing at this point, it's a data integrity issue.
          // We should have already checked selectedShiftDetails outside this loop. 
          // If existingStudent.shift_id is present but existingStudentShiftDetails is not found in latestShifts, it's a problem.
          if (!selectedShiftDetails || !existingStudentShiftDetails) {
            console.error("Critical: Missing shift details for overlap check. New shiftId:", shiftId, "Existing student shiftId:", existingStudent.shift_id);
            return true; // Assume conflict due to critical missing data.
          }

          // Both have valid shift details, perform time overlap check.
          const overlapResult = checkOverlap(
            selectedShiftDetails.start_time,
            selectedShiftDetails.end_time,
            existingStudentShiftDetails.start_time,
            existingStudentShiftDetails.end_time
          );
          return overlapResult; // True if shifts overlap, meaning seat is unavailable during that time.
        }
        return false; // Not the same seat, no conflict.
      });

      if (isSeatUnavailableDueToOverlap) {
        toast({
          variant: 'destructive',
          title: "Seat Unavailable",
          description: `Seat #${seatNumber} is already occupied by another student during an overlapping shift. Please choose another seat or an available shift.`,
        });
        return;
      }
    }

    const studentData = {
        name: formData.get('name') as string,
        // email: formData.get('email') as string || null, // Make email optional
        phone: formData.get('phone') as string,
        shift_id: shiftId,
        seat_number: seatNumber,
        id_number: formData.get('id_number') as string || null,
        join_date: formData.get('join_date') ? new Date(formData.get('join_date') as string).toISOString() : new Date().toISOString(),
    };

    const { error } = student
        ? await supabase.from('students').update(studentData).eq('id', student.id)
        : await supabase.from('students').insert({ ...studentData, library_id: libraryId, status: 'active' });

    if (error) {
        toast({ title: "Error saving student", description: error.message, variant: "destructive" });
    } else {
        toast({
          title: student ? "Student Updated" : "Student Added",
          description: `${formData.get('name')} has been successfully ${student ? 'updated' : 'added'}.`,
        });
        setOpen(false);
        router.refresh()
        onActionComplete?.();
    }
  };

  const handleStatusChange = async () => {
    if (!student) return;
    const newStatus = student.status === 'active' ? 'inactive' : 'active';

    const { error } = await supabase.from('students').update({ status: newStatus }).eq('id', student.id);
    if(error){
        toast({ title: "Error updating status", description: error.message, variant: "destructive" });
    } else {
        toast({
            title: "Status Updated",
            description: `${student.name} is now ${newStatus}.`,
        });
        router.refresh()
        onActionComplete?.();
    }
  }

  const handleDelete = async () => {
    if (!student) return;

    // First, delete payments associated with the student
    const { error: paymentsError } = await supabase.from('payments').delete().eq('student_id', student.id);

    if (paymentsError) {
      toast({ title: "Error deleting student's payments", description: paymentsError.message, variant: "destructive" });
      return;
    }

    // Then, delete the student
    const { error: studentError } = await supabase.from('students').delete().eq('id', student.id);

    if (studentError) {
      toast({ title: "Error deleting student", description: studentError.message, variant: "destructive" });
    } else {
      toast({
        title: "Student Deleted",
        description: `${student.name} has been successfully deleted.`
      });
      setIsDeleteDialogOpen(false);
      router.push('/dashboard/students');
    }
  };


  const formContent = (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>{student ? "Edit Student" : "Add New Student"}</DialogTitle>
        <DialogDescription>
          {student ? "Update the student's details." : "Fill in the details for the new student."}
        </DialogDescription>
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
          <Label htmlFor="id_number" className="text-right">ID Number </Label>
          <Input id="id_number" name="id_number" defaultValue={student?.id_number} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="shift_id" className="text-right">Shift*</Label>
          <Select name="shift_id" defaultValue={student?.shift_id ?? undefined}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a shift" />
            </SelectTrigger>
            <SelectContent>
              {shifts.map(shift => (
                <SelectItem key={shift.id} value={shift.id!}>{shift.name} ({new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(shift.fee)})</SelectItem>
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
              <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                      <Link href={`/dashboard/students/${student.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                      </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setOpen(true)}>
                      <Edit className="mr-2 h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleStatusChange}>
                      {student.status === 'active' ? <UserX className="mr-2 h-4 w-4" /> : <UserCheck className="mr-2 h-4 w-4" /> }
                      <span>{student.status === 'active' ? 'Mark as Inactive' : 'Mark as Active'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
          <DialogContent className="sm:max-w-[425px]">
            {formContent}
          </DialogContent>
        </Dialog>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete {student.name}? This action cannot be undone.
              </DialogDescription>
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
