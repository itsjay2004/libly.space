"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shifts, students as allStudents, librarySettings } from "@/lib/data";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import StudentActions from "@/components/students/student-actions";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@/lib/types";

export default function SeatManagementPage() {
  const [selectedShift, setSelectedShift] = useState(shifts[0].id);
  const [students, setStudents] = useState<Student[]>(allStudents);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  const { toast } = useToast();

  const getStudentForSeat = (seatNumber: number) => {
    const fullDayShiftId = shifts.find(s => s.name === 'Full Day')?.id;
    const selectedShiftDetails = shifts.find(s => s.id === selectedShift);

    return students.find((student) => {
      if (student.seatNumber !== seatNumber) return false;

      // A full-day student occupies the seat for all shifts.
      if (student.shiftId === fullDayShiftId) return true;
      
      // If the selected shift is 'Full Day', show all occupied seats.
      if (selectedShiftDetails?.name === 'Full Day') return true;

      // Otherwise, check if the student's shift matches the selected one.
      return student.shiftId === selectedShift;
    });
  };
  
  const studentForSelectedSeat = selectedSeat ? getStudentForSeat(selectedSeat) : null;

  const totalSeats = librarySettings.totalSeats;

  const handleSeatClick = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setIsModalOpen(true);
  };

  const handleUnassign = () => {
    if (!studentForSelectedSeat) return;

    setStudents(students.map(s => 
      s.id === studentForSelectedSeat.id ? { ...s, seatNumber: null } : s
    ));

    toast({
      title: "Seat Unassigned",
      description: `${studentForSelectedSeat.name} has been unassigned from seat #${selectedSeat}.`,
    });
    setIsModalOpen(false);
    setSelectedSeat(null);
  };

  const AssignSeatDialogContent = () => {
     const unassignedStudents = students.filter(s => s.shiftId === selectedShift && s.seatNumber === null && s.status === 'active');
     const [selectedStudentId, setSelectedStudentId] = useState<string>("");

     const handleAssign = () => {
        if (!selectedStudentId || !selectedSeat) return;
        
        const isSeatOccupiedByFullDay = students.some(s => 
            s.seatNumber === selectedSeat &&
            s.shiftId === shifts.find(shift => shift.name === 'Full Day')?.id
        );

        if(isSeatOccupiedByFullDay){
            toast({
              variant: 'destructive',
              title: "Seat Already Booked",
              description: `Seat #${selectedSeat} is already booked for the full day.`,
            });
            return;
        }

        setStudents(students.map(s => {
          if (s.id === selectedStudentId) {
            return { ...s, seatNumber: selectedSeat };
          }
          return s;
        }));

        const student = students.find(s => s.id === selectedStudentId);
        toast({
          title: "Seat Assigned",
          description: `${student?.name} has been assigned to seat #${selectedSeat}.`,
        });
        setIsModalOpen(false);
        setSelectedSeat(null);
     };

    if (studentForSelectedSeat) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Seat #{selectedSeat} - Occupied</DialogTitle>
            <DialogDescription>
              This seat is currently assigned to {studentForSelectedSeat.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
              <p><strong>Student:</strong> {studentForSelectedSeat.name}</p>
              <p><strong>Phone:</strong> {studentForSelectedSeat.phone}</p>
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
           <StudentActions />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedStudentId}>Assign to Selected</Button>
        </DialogFooter>
      </>
    );
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <Select value={selectedShift} onValueChange={setSelectedShift}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Select a shift" />
          </SelectTrigger>
          <SelectContent>
            {shifts.map((shift) => (
              <SelectItem key={shift.id} value={shift.id}>
                {shift.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Library Layout</CardTitle>
          <p className="text-sm text-muted-foreground">
              Click on a seat to assign or manage it.
          </p>
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
                      {isOccupied ? student.name.split(" ")[0] : "Available"}
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
