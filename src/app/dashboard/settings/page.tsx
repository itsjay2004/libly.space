"use client";

import { useState } from 'react';
import { librarySettings, shifts as initialShifts } from '@/lib/data';
import type { Shift } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const [totalSeats, setTotalSeats] = useState(librarySettings.totalSeats);
  const [shifts, setShifts] = useState<Shift[]>(initialShifts);
  const { toast } = useToast();

  const handleShiftChange = (index: number, field: keyof Omit<Shift, 'capacity'>, value: string | number) => {
    const newShifts = [...shifts];
    (newShifts[index] as any)[field] = value;
    setShifts(newShifts);
  };
  
  const addShift = () => {
    setShifts([...shifts, { id: `shift-${Math.random().toString(36).substr(2, 9)}`, name: '', startTime: '', endTime: '', capacity: totalSeats, fee: 0 }]);
  };

  const removeShift = (index: number) => {
    const newShifts = shifts.filter((_, i) => i !== index);
    setShifts(newShifts);
  };
  
  const handleSave = () => {
    // Mock save logic
    console.log({ totalSeats, shifts });
    toast({
        title: "Settings Saved",
        description: "Your library settings have been updated.",
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>General Configuration</CardTitle>
            <CardDescription>Set the total number of seats in your library.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-w-sm">
              <Label htmlFor="total-seats">Total Seats</Label>
              <Input
                id="total-seats"
                type="number"
                value={totalSeats}
                onChange={(e) => setTotalSeats(Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shift Management</CardTitle>
            <CardDescription>Define the shifts, timings, and fee for each.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shifts.map((shift, index) => (
              <div key={index} className="space-y-4 p-4 border rounded-lg relative">
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeShift(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                    <Input id={`shift-name-${index}`} value={shift.name} onChange={(e) => handleShiftChange(index, 'name', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`fee-${index}`}>Fee (₹)</Label>
                    <Input id={`fee-${index}`} type="number" value={shift.fee} onChange={(e) => handleShiftChange(index, 'fee', Number(e.target.value))} />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`start-time-${index}`}>Start Time</Label>
                    <Input id={`start-time-${index}`} type="time" value={shift.startTime} onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`end-time-${index}`}>End Time</Label>
                    <Input id={`end-time-${index}`} type="time" value={shift.endTime} onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
            <Button variant="outline" onClick={addShift}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Shift
            </Button>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}
