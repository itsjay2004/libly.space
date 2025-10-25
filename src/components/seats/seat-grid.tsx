"use client";

import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Student, Shift } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface SeatProps {
  seatNumber: number;
  student: (Student & { shifts: Shift | null; }) | null;
  onClick: (seatNumber: number) => void;
}

const Seat = ({ seatNumber, student, onClick }: SeatProps) => {
  const isOccupied = !!student;
  return (
    <button
      onClick={() => onClick(seatNumber)}
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
      <div className="text-xs text-muted-foreground w-full flex flex-col items-center leading-tight">
        {isOccupied && student?.shifts?.name ? (
            <>
                <span className="truncate">{student.name.split(" ")[0]}</span>
                <span className="truncate">({student.shifts.name})</span>
            </>
        ) : (
            <span>Available</span>
        )}
      </div>
    </button>
  );
};

interface SeatGridProps {
  loading: boolean;
  totalSeats: number;
  getStudentForSeat: (seatNumber: number) => (Student & { shifts: Shift | null; }) | null;
  handleSeatClick: (seatNumber: number) => void;
}

const SeatGrid = ({ loading, totalSeats, getStudentForSeat, handleSeatClick }: SeatGridProps) => {
  if (loading) {
    return (
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Library Layout</CardTitle>
        <CardDescription>
          Click on a seat to assign or manage it.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(6rem,1fr))] gap-4">
          {Array.from({ length: totalSeats }, (_, i) => i + 1).map((seatNumber) => (
            <Seat
              key={seatNumber}
              seatNumber={seatNumber}
              student={getStudentForSeat(seatNumber)}
              onClick={handleSeatClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeatGrid;
