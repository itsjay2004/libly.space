"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentActions from "@/components/students/student-actions";
import { useToast } from "@/hooks/use-toast";
import type { Student, Shift } from "@/lib/types";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { checkOverlap } from "@/lib/time-utils";

interface AssignSeatDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedSeat: number | null;
  studentForSelectedSeat: (Student & { shifts: Shift | null }) | null;
  students: Student[];
  shifts: Shift[];
  selectedShift: string | undefined;
  libraryId: string | null;
  onActionComplete: () => void;
}

export default function AssignSeatDialog({
  isOpen,
  onOpenChange,
  selectedSeat,
  studentForSelectedSeat,
  students,
  shifts,
  selectedShift,
  libraryId,
  onActionComplete,
}: AssignSeatDialogProps) {
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");

  const assignSeatMutation = useMutation({
    mutationFn: async ({ studentId, seatNumber }: { studentId: string; seatNumber: number }) => {
        const { error } = await supabase
            .from('students')
            .update({ seat_number: seatNumber })
            .eq('id', studentId);
        if (error) throw error;
    },
    onSuccess: (_, variables) => {
        toast({ title: "Seat Assigned", description: `Seat #${variables.seatNumber} has been assigned.` });
        queryClient.invalidateQueries({ queryKey: ['students', libraryId] });
        onOpenChange(false);
    },
    onError: (error) => {
        toast({ title: "Error assigning seat", description: error.message, variant: "destructive" });
    }
  });

  const unassignSeatMutation = useMutation({
      mutationFn: async (studentId: string) => {
          const { error } = await supabase
              .from('students')
              .update({ seat_number: null })
              .eq('id', studentId);
          if (error) throw error;
      },
      onSuccess: () => {
          toast({ title: "Seat Unassigned" });
          queryClient.invalidateQueries({ queryKey: ['students', libraryId] });
          onOpenChange(false);
      },
      onError: (error) => {
          toast({ title: "Error unassigning seat", description: error.message, variant: "destructive" });
      }
  });


  const handleAssign = async () => {
    if (!selectedStudentId || !selectedSeat || !libraryId) return;

    const currentlySelectedShiftDetails = shifts.find(s => s.id === selectedShift);
    if (!currentlySelectedShiftDetails) {
      toast({ title: "Error", description: "Selected shift details not found.", variant: "destructive" });
      return;
    }

    const isOverlappingAssigned = students.some(existingStudent => {
      if (existingStudent.seat_number !== selectedSeat || !existingStudent.shift_id || !existingStudent.shifts) return false;

      const existingStudentShift = shifts.find(s => s.id === existingStudent.shift_id);
      if (!existingStudentShift) return false;

      return checkOverlap(
        currentlySelectedShiftDetails.start_time,
        currentlySelectedShiftDetails.end_time,
        existingStudentShift.start_time,
        existingStudentShift.end_time
      );
    });

    if (isOverlappingAssigned) {
      toast({
        variant: 'destructive',
        title: "Seat Unavailable",
        description: `Seat #${selectedSeat} is already assigned for an overlapping shift.`,
      });
      return;
    }

    assignSeatMutation.mutate({ studentId: selectedStudentId, seatNumber: selectedSeat });
  };
  
  const unassignedStudents = students.filter(s => s.shift_id === selectedShift && s.seat_number === null && s.status === 'active');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {studentForSelectedSeat ? (
          <>
            <DialogHeader>
              <DialogTitle>Seat #{selectedSeat} - Occupied</DialogTitle>
              <DialogDescription>
                Assigned to {studentForSelectedSeat.name} for the {studentForSelectedSeat.shifts?.name} shift.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-1">
              <p><strong>Student:</strong> {studentForSelectedSeat.name}</p>
              <p><strong>Phone:</strong> {studentForSelectedSeat.phone}</p>
              <p><strong>Shift:</strong> {studentForSelectedSeat.shifts?.name}</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
              <Button variant="destructive" onClick={() => unassignSeatMutation.mutate(studentForSelectedSeat.id)} disabled={unassignSeatMutation.isPending}>
                {unassignSeatMutation.isPending ? "Unassigning..." : "Unassign Seat"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Assign Seat #{selectedSeat}</DialogTitle>
              <DialogDescription>
                Select a student to assign to this seat.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <Select onValueChange={setSelectedStudentId} value={selectedStudentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an unassigned student" />
                </SelectTrigger>
                <SelectContent>
                  {unassignedStudents.length > 0 ? unassignedStudents.map(student => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.name} ({student.phone})
                    </SelectItem>
                  )) : <p className="p-4 text-sm text-muted-foreground">No unassigned students in this shift.</p>}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4">
                <div className="flex-1 border-t" />
                <p className="text-sm text-muted-foreground">OR</p>
                <div className="flex-1 border-t" />
              </div>
              <StudentActions onActionComplete={() => { onActionComplete(); onOpenChange(false); }} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedStudentId || assignSeatMutation.isPending}>
                {assignSeatMutation.isPending ? "Assigning..." : "Assign to Selected"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
