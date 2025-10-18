
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { Skeleton } from '@/components/ui/skeleton';
import NProgress from 'nprogress';
import { Loader2 } from 'lucide-react';

interface LibrarySetupProps {
  updateOnboardingStatus: (status: string) => void;
}

const LibrarySetup = ({ updateOnboardingStatus }: LibrarySetupProps) => {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [libraryName, setLibraryName] = useState('');
  const [totalSeats, setTotalSeats] = useState(1);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchInitialData = useCallback(async () => {
    NProgress.start();
    setLoading(true);
    const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error fetching user in LibrarySetup:", userError);
      setLoading(false);
      NProgress.done();
      return;
    }

    if (currentUser) {
      setUser(currentUser);
      const { data: profileData } = await supabase
        .from('profiles')
        .select('library_name')
        .eq('id', currentUser.id)
        .single();
      
      if (profileData?.library_name) {
        setLibraryName(profileData.library_name);
      }

      const { data: libraryData } = await supabase
        .from('libraries')
        .select('id, name, total_seats')
        .eq('owner_id', currentUser.id)
        .single();

      if (libraryData) {
        setLibraryId(libraryData.id);
        setLibraryName(libraryData.name);
        setTotalSeats(libraryData.total_seats);

        const { data: shiftsData } = await supabase
          .from('shifts')
          .select('*')
          .eq('library_id', libraryData.id)
          .order('start_time', { ascending: true });

        if (shiftsData) {
          setShifts(shiftsData.map(s => ({ ...s, fee: s.fee || 0 })));
        }
      }
    } else {
      setShifts([{ library_id: '', name: '', start_time: '', end_time: '', fee: 0, id: `new-${Date.now()}` }]);
    }
    setLoading(false);
    NProgress.done();
  }, [supabase]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const handleShiftChange = (index: number, field: keyof Omit<Shift, 'id' | 'library_id'>, value: string | number) => {
    const newShifts = [...shifts];
    (newShifts[index] as any)[field] = value;
    setShifts(newShifts);
  };
  
  const addShift = () => {
    const newShift = { library_id: libraryId || '', name: '', start_time: '', end_time: '', fee: 0, id: `new-${Date.now()}` };
    setShifts([...shifts, newShift as Shift]);
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
    
    NProgress.start();
    setIsSaving(true);

    const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({ library_name: libraryName })
        .eq('id', user.id);

    if (profileUpdateError) {
        toast({ title: "Error updating profile", description: profileUpdateError.message, variant: "destructive" });
        setIsSaving(false);
        NProgress.done();
        return;
    }

    let currentLibraryId = libraryId;
    if (!currentLibraryId) {
        const { data, error } = await supabase
            .from('libraries')
            .insert({ owner_id: user.id, name: libraryName, total_seats: totalSeats })
            .select('id')
            .single();

        if (error || !data) {
            toast({ title: "Error creating library", description: error?.message, variant: "destructive" });
            setIsSaving(false);
            NProgress.done();
            return;
        }
        currentLibraryId = data.id;
        setLibraryId(currentLibraryId);
    } else {
        const { error } = await supabase.from('libraries').update({ name: libraryName, total_seats: totalSeats }).eq('id', currentLibraryId);
        if (error) {
            toast({ title: "Error updating library", description: error.message, variant: "destructive" });
            setIsSaving(false);
            NProgress.done();
            return;
        }
    }
    
    const shiftsToInsert = shifts
      .filter(s => typeof s.id === 'string' && s.id.startsWith('new-'))
      .map(({ id, ...rest }) => ({ ...rest, library_id: currentLibraryId! }));

    if (shiftsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(shiftsToInsert);
        if (insertError) {
            toast({ title: "Error saving shifts", description: insertError.message, variant: "destructive" });
            setIsSaving(false);
            NProgress.done();
            return;
        }
    }

    toast({
        title: "Library Setup Complete",
        description: "Your library details and shifts have been saved.",
    });

    updateOnboardingStatus('step2');
    setIsSaving(false);
    NProgress.done();
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
                <div className="grid gap-4">
                    <div className="grid gap-2 max-w-sm">
                      <Label htmlFor="library-name"><Skeleton className="h-4 w-24" /></Label>
                      <Skeleton className="h-10 w-full" />
                    </div>
                    <div className="grid gap-2 max-w-sm">
                      <Label htmlFor="total-seats"><Skeleton className="h-4 w-24" /></Label>
                      <Skeleton className="h-10 w-full" />
                    </div>
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
            <CardTitle>Welcome! Let's Set Up Your Library.</CardTitle>
            <CardDescription>This is the first step to getting your library operational. Please provide some basic details to get started.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="library-name">Library Name</Label>
                <Input
                  id="library-name"
                  type="text"
                  value={libraryName}
                  onChange={(e) => setLibraryName(e.target.value)}
                  placeholder="My Awesome Study Hub"
                />
                <p className="text-sm text-muted-foreground">This name will be displayed prominently within your dashboard and to your students.</p>
              </div>
              <div className="grid gap-2 max-w-sm">
                <Label htmlFor="total-seats">Total Seats</Label>
                <Input
                  id="total-seats"
                  type="number"
                  value={totalSeats}
                  onChange={(e) => setTotalSeats(Number(e.target.value))}
                  placeholder="50"
                />
                <p className="text-sm text-muted-foreground">Enter the total number of physical seats available in your library. This is crucial for managing capacity.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Define Your Operating Shifts</CardTitle>
            <CardDescription>Set up the different time slots your library operates, along with their associated fees. You can add as many shifts as you need.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shifts.map((shift, index) => (
              <div key={shift.id} className="space-y-4 p-4 border rounded-lg relative shadow-sm">
                 <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive" onClick={() => removeShift(index)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor={`shift-name-${index}`}>Shift Name</Label>
                    <Input id={`shift-name-${index}`} value={shift.name} onChange={(e) => handleShiftChange(index, 'name', e.target.value)} placeholder="e.g., Morning Shift" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor={`fee-${index}`}>Fee (₹)</Label>
                    <Input id={`fee-${index}`} type="number" value={shift.fee} onChange={(e) => handleShiftChange(index, 'fee', Number(e.target.value))} placeholder="e.g., 500" />
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
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save and Continue'}
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LibrarySetup;
