"use client";

import { useSeatManagement } from "@/hooks/use-seat-management";
import SeatGrid from "@/components/seats/seat-grid";
import AssignSeatDialog from "@/components/seats/assign-seat-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";

export default function SeatManagementPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const {
    loading,
    library,
    totalSeats,
    shifts,
    students,
    selectedShift,
    setSelectedShift,
    isModalOpen,
    setIsModalOpen,
    selectedSeat,
    getStudentForSeat,
    studentForSelectedSeat,
    handleSeatClick,
  } = useSeatManagement(user);

  if (!library && !loading) {
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
  
  const refreshData = () => {
      queryClient.invalidateQueries({ queryKey: ['students', library?.id] });
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
      <SeatGrid
        loading={loading}
        totalSeats={totalSeats}
        getStudentForSeat={getStudentForSeat}
        handleSeatClick={handleSeatClick}
      />
      <AssignSeatDialog
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        selectedSeat={selectedSeat}
        studentForSelectedSeat={studentForSelectedSeat}
        students={students}
        shifts={shifts}
        selectedShift={selectedShift}
        libraryId={library?.id || null}
        onActionComplete={refreshData}
      />
    </div>
  );
}
