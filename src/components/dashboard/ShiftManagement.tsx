'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, PlusCircle, AlertTriangle } from "lucide-react";
import type { Shift } from '@/lib/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";


interface ShiftManagementProps {
  shifts: Partial<Shift>[];
  setShifts: React.Dispatch<React.SetStateAction<Partial<Shift>[]>>;
  isSaving: boolean;
  onSave: () => void;
  onRemove: (id: string) => void;
  isDeletingShift: boolean;
}

export function ShiftManagement({
  shifts,
  setShifts,
  isSaving,
  onSave,
  onRemove,
  isDeletingShift,
}: ShiftManagementProps) {

  const [shiftToDelete, setShiftToDelete] = useState<string | null>(null);

  const handleShiftChange = (index: number, field: keyof Shift, value: any) => {
    const newShifts = [...shifts];
    newShifts[index] = { ...newShifts[index], [field]: value };
    setShifts(newShifts);
  };

  const handleAddNewShift = () => {
    setShifts([
      ...shifts,
      { id: `temp-${Date.now()}`, name: '', start_time: '', end_time: '', fee: 0 }
    ]);
  };

  const confirmRemove = () => {
      if(shiftToDelete){
          onRemove(shiftToDelete);
          setShiftToDelete(null);
      }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Shift Management</CardTitle>
          <CardDescription>
            Define the different shifts for your library.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {shifts.map((shift, index) => (
            <div key={shift.id || index} className="space-y-4 p-4 border rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                  <Input
                    id={`shift-name-${index}`}
                    value={shift.name || ''}
                    onChange={(e) => handleShiftChange(index, 'name', e.target.value)}
                    placeholder="e.g., Morning Shift"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`shift-fee-${index}`}>Monthly Fee (INR)</Label>
                  <Input
                    id={`shift-fee-${index}`}
                    type="number"
                    value={shift.fee || ''}
                    onChange={(e) => handleShiftChange(index, 'fee', parseFloat(e.target.value))}
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                  <Input
                    id={`start-time-${index}`}
                    type="time"
                    value={shift.start_time || ''}
                    onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor={`end-time-${index}`}>End Time</Label>
                  <Input
                    id={`end-time-${index}`}
                    type="time"
                    value={shift.end_time || ''}
                    onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end mt-2">
                 <Button variant="ghost" size="icon" onClick={() => setShiftToDelete(shift.id as string)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <Button variant="outline" onClick={handleAddNewShift} className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" /> Add New Shift
          </Button>

          <div className="flex justify-end pt-4">
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Shifts'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={!!shiftToDelete} onOpenChange={(open) => !open && setShiftToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="text-destructive"/> Are you absolutely sure?
            </AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the shift.
                You cannot delete a shift if it is currently assigned to any students.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
                onClick={confirmRemove}
                disabled={isDeletingShift}
                className="bg-destructive hover:bg-destructive/90"
            >
                {isDeletingShift ? "Deleting..." : "Yes, delete shift"}
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
     </AlertDialog>

    </>
  );
}
