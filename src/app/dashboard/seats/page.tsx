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
import { shifts, students, librarySettings } from "@/lib/data";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SeatManagementPage() {
  const [selectedShift, setSelectedShift] = useState(shifts[0].id);

  const getStudentForSeat = (seatNumber: number) => {
    return students.find(
      (student) =>
        student.seatNumber === seatNumber && student.shiftId === selectedShift
    );
  };

  const totalSeats = librarySettings.shifts.find(shift => shift.id === selectedShift)?.capacity ?? 0;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Seat Management</h1>
          <p className="text-muted-foreground">
            Visually manage seat assignments for each shift.
          </p>
        </div>
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
              Click on an available seat to assign it to a student.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
            {Array.from({ length: totalSeats }, (_, i) => i + 1).map(
              (seatNumber) => {
                const student = getStudentForSeat(seatNumber);
                const isOccupied = !!student;
                return (
                  <div
                    key={seatNumber}
                    className={cn(
                      "flex flex-col items-center justify-center p-2 sm:p-4 rounded-lg",
                      isOccupied ? "bg-muted" : "bg-card border"
                    )}
                  >
                    <Armchair
                      className={cn(
                        "h-6 w-6 sm:h-8 sm:w-8",
                        isOccupied ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    <p className="mt-2 text-base sm:text-lg font-bold">{seatNumber}</p>
                    <p className="text-xs text-muted-foreground text-center">
                      {isOccupied ? student.name.split(" ")[0] + "..." : "Available"}
                    </p>
                  </div>
                );
              }
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
