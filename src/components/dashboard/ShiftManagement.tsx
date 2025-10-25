'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { PlusCircle, Trash2 } from 'lucide-react';
import type { Shift } from '@/lib/types';
import type { Toast } from "@/hooks/use-toast";

interface ShiftManagementProps {
  shifts: Shift[];
  setShifts: (shifts: Shift[]) => void;
  libraryId: string | null;
  isSaving: boolean;
  onSave: () => void;
  onRemove: (shiftId: number | string) => void;
  toast: (props: Toast) => void
}

export function ShiftManagement({
  shifts,
  setShifts,
  libraryId,
  isSaving,
  onSave,
  onRemove,
  toast
}: ShiftManagementProps) {

  const handleShiftChange = (index: number, field: keyof Omit<Shift, 'id' | 'library_id'>, value: string | number) => {
    const newShifts = shifts.map((shift, i) => {
      if (i === index) {
        return { ...shift, [field]: value };
      }
      return shift;
    });
    setShifts(newShifts);
  };

  const addShift = () => {
    if (!libraryId) {
      toast({
        title: "Please save general settings first",
        description: "You need to create a library before adding shifts.",
        variant: "destructive",
      });
      return;
    }
    const newShift = {
      library_id: libraryId,
      name: '',
      start_time: '',
      end_time: '',
      fee: 0,
      id: `new-${Date.now()}`,
    };
    setShifts([...shifts, newShift as Shift]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Management</CardTitle>
        <CardDescription>Define the shifts, timings, and fee for each.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {shifts.map((shift, index) => (
          <div key={shift.id} className="space-y-4 p-4 border rounded-lg relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
              onClick={() => onRemove(shift.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                <Input
                  id={`shift-name-${index}`}
                  value={shift.name}
                  onChange={(e) => handleShiftChange(index, 'name', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`fee-${index}`}>Fee (₹)</Label>
                <Input
                  id={`fee-${index}`}
                  type="number"
                  value={shift.fee}
                  onChange={(e) => handleShiftChange(index, 'fee', Number(e.target.value))}
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                <Input
                  id={`start-time-${index}`}
                  type="time"
                  value={shift.start_time}
                  onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`end-time-${index}`}>End Time</Label>
                <Input
                  id={`end-time-${index}`}
                  type="time"
                  value={shift.end_time}
                  onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)}
                />
              </div>
            </div>
          </div>
        ))}
        <Button variant="outline" onClick={addShift}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Shift
        </Button>
        <div className="flex justify-end mt-4">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Shifts'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
