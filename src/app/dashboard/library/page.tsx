"use client";

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsPage() {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [totalSeats, setTotalSeats] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async (currentUser: User) => {
    setLoading(true);
    const { data: libraryData, error: libraryError } = await supabase
      .from('libraries')
      .select('id, total_seats')
      .eq('owner_id', currentUser.id)
      .single();

    if (libraryData) {
      setLibraryId(libraryData.id);
      setTotalSeats(libraryData.total_seats);

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('library_id', libraryData.id);

      if (shiftsData) {
        setShifts(shiftsData.map(s => ({ ...s, fee: s.fee || 0 })));
      }
      if (shiftsError) {
        toast({ title: "Error fetching shifts", description: shiftsError.message, variant: "destructive" });
      }
    } else if (libraryError?.code !== 'PGRST116') { // Ignore "no rows found"
      toast({ title: "Error fetching library settings", description: libraryError.message, variant: "destructive" });
    }
    setLoading(false);
  }, [supabase, toast]);

  useEffect(() => {
    const getUserAndSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        fetchSettings(user);
      } else {
        setLoading(false);
      }
    };
    getUserAndSettings();
  }, [supabase, fetchSettings]);

  const handleShiftChange = (index: number, field: keyof Omit<Shift, 'id' | 'library_id'>, value: string | number) => {
    const newShifts = [...shifts];
    (newShifts[index] as any)[field] = value;
    setShifts(newShifts);
  };
  
  const addShift = () => {
    setShifts([...shifts, { library_id: libraryId || '', name: '', start_time: '', end_time: '', fee: 0 }]);
  };

  const removeShift = (index: number) => {
    const newShifts = shifts.filter((_, i) => i !== index);
    setShifts(newShifts);
  };
  
  const handleSave = async () => {
    if (!user) {
        toast({ title: "You must be logged in to save settings.", variant: "destructive" });
        return;
    }

    let currentLibraryId = libraryId;

    if (!currentLibraryId) {
        const { data, error } = await supabase
            .from('libraries')
            .insert({ owner_id: user.id, name: `${user.email}'s Library`, total_seats: totalSeats })
            .select('id')
            .single();

        if (error || !data) {
            toast({ title: "Error creating library", description: error?.message, variant: "destructive" });
            return;
        }
        currentLibraryId = data.id;
        setLibraryId(currentLibraryId);
    } else {
        const { error } = await supabase.from('libraries').update({ total_seats: totalSeats }).eq('id', currentLibraryId);
        if (error) {
            toast({ title: "Error updating library", description: error.message, variant: "destructive" });
            return;
        }
    }
    
    const shiftsToInsert = shifts.filter(s => !s.id).map(s => ({...s, library_id: currentLibraryId}));
    const shiftsToUpdate = shifts.filter(s => s.id);

    if (shiftsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(shiftsToInsert);
        if (insertError) {
            toast({ title: "Error saving new shifts", description: insertError.message, variant: "destructive" });
            return;
        }
    }

    if (shiftsToUpdate.length > 0) {
        const { error: updateError } = await supabase.from('shifts').upsert(shiftsToUpdate);
        if (updateError) {
            toast({ title: "Error updating shifts", description: updateError.message, variant: "destructive" });
            return;
        }
    }

    toast({
        title: "Settings Saved",
        description: "Your library settings have been updated.",
    });
    if (user) fetchSettings(user);
  }

  if (loading) {
      return (
        <div className="flex flex-col gap-8">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="total-seats"><Skeleton className="h-4 w-24" /></Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
                <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 p-4 border rounded-lg">
                  <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
                <Skeleton className="h-10 w-36" />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Skeleton className="h-10 w-24" />
            </div>
          </div>
        </div>
      );
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
              <div key={shift.id || index} className="space-y-4 p-4 border rounded-lg relative">
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
                    <Input id={`start-time-${index}`} type="time" value={shift.start_time} onChange={(e) => handleShiftChange(index, 'start_time', e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`end-time-${index}`}>End Time</Label>
                    <Input id={`end-time-${index}`} type="time" value={shift.end_time} onChange={(e) => handleShiftChange(index, 'end_time', e.target.value)} />
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
