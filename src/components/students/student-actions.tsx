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
import { useSharedUser } from "@/contexts/UserContext"; 
import { Tooltip, TooltipProvider, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { checkOverlap } from '@/lib/time-utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface StudentFormInput {
  name: string;
  phone: string;
  address?: string | null;
  gender?: string | null;
  shift_id: string;
  seat_number?: number | null;
  id_number?: string | null;
  join_date: string;
}

export default function StudentActions({ student, onActionComplete }: { student?: Student, onActionComplete?: () => void }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { user, libraryId, isStudentLimitReached, isSubscriptionExpired } = useSharedUser();

  // Fetch shifts using useQuery
  const { data: shifts = [], isLoading: isLoadingShifts } = useQuery<Shift[], Error>({
    queryKey: ['shifts', libraryId],
    queryFn: async () => {
      if (!libraryId) return [];
      const { data, error } = await supabase
        .from('shifts')
        .select('*')
        .eq('library_id', libraryId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!libraryId, // Only run if libraryId is available
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });

  const addUpdateStudentMutation = useMutation<void, Error, StudentFormInput>({
    mutationFn: async (studentData: StudentFormInput) => {
      if (!libraryId) {
          throw new Error("Could not find library. Please ensure your library is set up.");
      }

      if (!student && (isStudentLimitReached || isSubscriptionExpired)) {
        throw new Error(
          isStudentLimitReached
            ? "You have reached your student limit. Please upgrade your plan."
            : "Your subscription has expired. Please renew to add new students."
        );
      }

      // Seat availability check
      if (studentData.seat_number) { 
        const { data: currentStudents, error: fetchStudentsError } = await supabase
          .from('students')
          .select('id, shift_id, seat_number, shifts(start_time, end_time)')
          .eq('library_id', libraryId);

        if (fetchStudentsError) {
          throw new Error(`Error fetching student data for seat check: ${fetchStudentsError.message}`);
        }

        // Use the shifts fetched by useQuery, or refetch if necessary (though useQuery should keep it fresh enough)
        const latestShifts = shifts; // Or queryClient.getQueryData(['shifts', libraryId])
        if (!latestShifts || latestShifts.length === 0) {
          throw new Error("Shift data not available for seat check.");
        }
        
        const selectedShiftDetails = latestShifts.find(s => s.id === studentData.shift_id);
        if (studentData.shift_id && !selectedShiftDetails) {
          throw new Error("Selected shift details not found.");
        }

        const isSeatUnavailableDueToOverlap = currentStudents.some(existingStudent => {
          if (student && existingStudent.id === student.id) {
            return false; // Don't check against the student being edited
          }
          
          if (existingStudent.seat_number === studentData.seat_number) {
            if (!studentData.shift_id || !existingStudent.shift_id) return true; // Seat taken, but no shift info for comparison
            
            const existingStudentShiftDetails = latestShifts.find(s => s.id === existingStudent.shift_id);
            if (!selectedShiftDetails || !existingStudentShiftDetails) return true; // Cannot compare shifts, assume taken

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
          throw new Error(`Seat #${studentData.seat_number} is already occupied by another student during an overlapping shift.`);
        }
      }

      const baseData = { ...studentData, library_id: libraryId };

      if (student) {
          const { error } = await supabase.from('students').update(baseData).eq('id', student.id);
          if (error) throw error;
      } else {
          const { error } = await supabase.from('students').insert(baseData);
          if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: student ? "Student Updated" : "Student Added",
        description: `${student?.name || 'Student'} has been successfully ${student ? 'updated' : 'added'}.`,
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['students', libraryId] });
      queryClient.invalidateQueries({ queryKey: ['studentCount', libraryId] });
      if (student) {
        queryClient.invalidateQueries({ queryKey: ['studentDetails', student.id] });
      }
      onActionComplete?.(); // Original callback, if any
    },
    onError: (error: any) => {
      toast({ title: "Error saving student", description: error.message, variant: "destructive" });
    }
  });

  const deleteStudentMutation = useMutation<void, Error, string>({
    mutationFn: async (studentIdToDelete: string) => {
      const { error } = await supabase.from('students').delete().eq('id', studentIdToDelete);
      if (error) throw error;
    },
    onSuccess: (_, studentIdToDelete) => {
      toast({ title: "Student Deleted", description: `${student?.name || 'Student'} has been successfully deleted.` });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['students', libraryId] });
      queryClient.invalidateQueries({ queryKey: ['studentCount', libraryId] });
      queryClient.removeQueries({ queryKey: ['studentDetails', studentIdToDelete] }); // Remove individual student cache
      router.push('/dashboard/students');
    },
    onError: (error: any) => {
      toast({ title: "Error deleting student", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const seatNumber = formData.get('seat_number') ? Number(formData.get('seat_number')) : null;
    const shiftId = formData.get('shift_id') as string;

    const studentData: StudentFormInput = {
        name: formData.get('name') as string,
        phone: formData.get('phone') as string,
        address: formData.get('address') as string || null,
        gender: formData.get('gender') as string || null,
        shift_id: shiftId,
        seat_number: seatNumber,
        id_number: formData.get('id_number') as string || null,
        join_date: formData.get('join_date') ? new Date(formData.get('join_date') as string).toISOString() : new Date().toISOString(),
    };

    addUpdateStudentMutation.mutate(studentData);
  };

  const handleDelete = () => {
    if (student) {
      deleteStudentMutation.mutate(student.id);
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
            <SelectTrigger className="col-span-3" disabled={isLoadingShifts}><SelectValue placeholder="Select a shift" /></SelectTrigger>
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
        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={addUpdateStudentMutation.isPending}>Cancel</Button>
        <Button type="submit" disabled={addUpdateStudentMutation.isPending}>
            {addUpdateStudentMutation.isPending ? 'Saving...' : 'Save changes'}
        </Button>
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
                  <DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteDialogOpen(true)} disabled={deleteStudentMutation.isPending}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
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
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={deleteStudentMutation.isPending}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleteStudentMutation.isPending}>
                  {deleteStudentMutation.isPending ? 'Deleting...' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  const disableAddStudent = isStudentLimitReached || isSubscriptionExpired || addUpdateStudentMutation.isPending;
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
