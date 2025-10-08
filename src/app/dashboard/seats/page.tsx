"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import StudentActions from "@/components/students/student-actions";
import { useToast } from "@/hooks/use-toast";
import type { Student, Shift } from "@/lib/types";
import { User } from "@supabase/supabase-js";
import { checkOverlap } from '@/lib/time-utils';
import { Skeleton } from "@/components/ui/skeleton";

export default function SeatManagementPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [totalSeats, setTotalSeats] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedShift, setSelectedShift] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentLibraryId: string) => {
    setLoading(true);
    const { data: studentsData, error: studentsError } = await supabase
      .from('students')
      .select('*, shifts(name, start_time, end_time)')
      .eq('library_id', currentLibraryId);

    if (studentsData) {
      setStudents(studentsData);
    }
    if (studentsError) {
      console.error("Error fetching students in seat management:", studentsError);
      toast({ title: "Error fetching students", description: studentsError.message, variant: "destructive" });
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    const getInitialData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        const { data: libraryData, error: libraryError } = await supabase
          .from('libraries')
          .select('id, total_seats')
          .eq('owner_id', user.id)
          .single();

        if (libraryData) {
          setLibraryId(libraryData.id);
          setTotalSeats(libraryData.total_seats);

          const { data: shiftsData, error: shiftsError } = await supabase
            .from('shifts')
            .select('*')
            .eq('library_id', libraryData.id);

          if (shiftsData) {
            setShifts(shiftsData);
            setSelectedShift(shiftsData[0]?.id);
          }
          if (shiftsError) {
            console.error("Error fetching shifts in seat management:", shiftsError);
            toast({ title: "Error fetching shifts", description: shiftsError.message, variant: "destructive" });
          }
          fetchData(libraryData.id);
        } else if (libraryError?.code !== 'PGRST116') {
          console.error("Error fetching library data in seat management:", libraryError);
          toast({ title: "Error fetching library data", description: libraryError.message, variant: "destructive" });
        }
      } else {
        setLoading(false);
      }
    };
    getInitialData();
  }, [supabase, toast, fetchData]);

  const getStudentForSeat = (seatNumber: number) => {
    const currentlySelectedShift = shifts.find(s => s.id === selectedShift);
    if (!currentlySelectedShift) return null;

    const overlappingStudents = students.filter(student => {
      if (student.seat_number !== seatNumber || !student.shift_id || !student.shifts) return false;
      
      const studentShift = shifts.find(s => s.id === student.shift_id);
      if (!studentShift) return false;

      console.log(`[getStudentForSeat Debug] currentlySelectedShift: ${currentlySelectedShift.start_time}-${currentlySelectedShift.end_time}`);
      console.log(`[getStudentForSeat Debug] studentShift: ${studentShift.start_time}-${studentShift.end_time}`);

      const overlapResult = checkOverlap(
        currentlySelectedShift.start_time,
        currentlySelectedShift.end_time,
        studentShift.start_time,
        studentShift.end_time
      );
      console.log(`[getStudentForSeat Debug] Overlap check result: ${overlapResult}`);
      return overlapResult;
    });
    return overlappingStudents.length > 0 ? overlappingStudents[0] : null;
  };
  
  const studentForSelectedSeat = selectedSeat ? getStudentForSeat(selectedSeat) : null;

  const handleSeatClick = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setIsModalOpen(true);
  };

  const handleUnassign = async () => {
    if (!studentForSelectedSeat) return;

    const { error } = await supabase
      .from('students')
      .update({ seat_number: null })
      .eq('id', studentForSelectedSeat.id);

    if (error) {
      toast({ title: "Error unassigning seat", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Seat Unassigned",
        description: `${studentForSelectedSeat.name} has been unassigned from seat #${selectedSeat}.`,
      });
      if(libraryId) fetchData(libraryId);
    }
    setIsModalOpen(false);
    setSelectedSeat(null);
  };

  const AssignSeatDialogContent = () => {
     const unassignedStudents = students.filter(s => s.shift_id === selectedShift && s.seat_number === null && s.status === 'active');
     const [selectedStudentId, setSelectedStudentId] = useState<string>("");

     const handleAssign = async () => {
        if (!selectedStudentId || !selectedSeat) return;
        
        const currentlySelectedShiftDetails = shifts.find(s => s.id === selectedShift);
        if (!currentlySelectedShiftDetails) {
          toast({ title: "Error", description: "Selected shift details not found.", variant: "destructive" });
          return;
        }

        // Corrected check for overlaps with existing assignments for the selected seat
        const isOverlappingAssigned = students.some(existingStudent => {
          // Only consider students already assigned to the *selected seat*
          if (existingStudent.seat_number !== selectedSeat || !existingStudent.shift_id || !existingStudent.shifts) return false;

          const existingStudentShift = shifts.find(s => s.id === existingStudent.shift_id);
          if (!existingStudentShift) return false;

          console.log(`[handleAssign Debug] New student's selected shift: ${currentlySelectedShiftDetails.start_time}-${currentlySelectedShiftDetails.end_time}`);
          console.log(`[handleAssign Debug] Existing student (${existingStudent.name})'s assigned shift: ${existingStudentShift.start_time}-${existingStudentShift.end_time}`);

          const overlapResult = checkOverlap(
            currentlySelectedShiftDetails.start_time,
            currentlySelectedShiftDetails.end_time,
            existingStudentShift.start_time,
            existingStudentShift.end_time
          );
          console.log(`[handleAssign Debug] Overlap check result: ${overlapResult}`);
          return overlapResult;
        });

        if (isOverlappingAssigned) {
          toast({
            variant: 'destructive',
            title: "Seat Unavailable",
            description: `Seat #${selectedSeat} is already assigned for an overlapping shift. Please choose another seat or unassign the conflicting student.`,
          });
          return;
        }

        const { error } = await supabase
          .from('students')
          .update({ seat_number: selectedSeat })
          .eq('id', selectedStudentId);

        if (error) {
          toast({ title: "Error assigning seat", description: error.message, variant: "destructive" });
        } else {
          const student = students.find(s => s.id === selectedStudentId);
          toast({
            title: "Seat Assigned",
            description: `${student?.name} has been assigned to seat #${selectedSeat}.`,
          });
          if (libraryId) fetchData(libraryId);
        }
        setIsModalOpen(false);
        setSelectedSeat(null);
     };

    if (studentForSelectedSeat) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Seat #{selectedSeat} - Occupied</DialogTitle>
            <DialogDescription>
              This seat is currently assigned to {studentForSelectedSeat.name} for the {studentForSelectedSeat.shifts?.name} shift.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-1">
              <p><strong>Student:</strong> {studentForSelectedSeat.name}</p>
              <p><strong>Phone:</strong> {studentForSelectedSeat.phone}</p>
               <p><strong>Shift:</strong> {studentForSelectedSeat.shifts?.name}</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Close</Button>
            <Button variant="destructive" onClick={handleUnassign}>Unassign Seat</Button>
          </DialogFooter>
        </>
      );
    }

    return (
      <> 
        <DialogHeader>
          <DialogTitle>Assign Seat #{selectedSeat}</DialogTitle>
           <DialogDescription>
            Assign this seat to an existing student or add a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
           <Select onValueChange={setSelectedStudentId}>
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
           <StudentActions onActionComplete={() => { if(libraryId) fetchData(libraryId); setIsModalOpen(false); }} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedStudentId}>Assign to Selected</Button>
        </DialogFooter>
      </>
    );
  };


  if (loading) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
          <Skeleton className="h-10 w-full sm:w-[180px]" />
        </div>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-32" /></CardTitle>
            <CardDescription><Skeleton className="h-4 w-48" /></CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-28 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!libraryId) {
    return (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
            <h2 className="text-2xl font-semibold mb-2">No Library Found</h2>
            <p className="mb-4">Please set up your library in the settings to manage seats.</p>
            <Button asChild>
                <a href="/dashboard/settings">Go to Settings</a>
            </Button>
        </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Select value={selectedShift} onValueChange={setSelectedShift}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id!}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Library Layout</CardTitle>
          <CardDescription>
              Click on a seat to assign or manage it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-4">
            {Array.from({ length: totalSeats }, (_, i) => i + 1).map(
              (seatNumber) => {
                const student = getStudentForSeat(seatNumber);
                const isOccupied = !!student;
                return (
                  <button
                    key={seatNumber}
                    onClick={() => handleSeatClick(seatNumber)}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 rounded-lg text-center transition-colors aspect-[3/4]",
                      isOccupied 
                        ? "bg-primary/10 border border-primary/20 hover:bg-primary/20" 
                        : "bg-card border hover:bg-muted"
                    )}
                  >
                    <Armchair
                      className={cn(
                        "h-8 w-8",
                        isOccupied ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <p className="mt-2 text-lg font-bold">{seatNumber}</p>
                    <p className="text-xs text-muted-foreground truncate w-full">
                      {isOccupied ? `${student.name.split(" ")[0]} (${student.shifts?.name})` : "Available"}
                    </p>
                  </button>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
            <AssignSeatDialogContent />
        </DialogContent>
      </Dialog>

    </div>
  );
}
