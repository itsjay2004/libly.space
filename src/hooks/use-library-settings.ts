
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';

export function useLibrarySettings() {
  const supabase = createClient();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [libraryId, setLibraryId] = useState<string | null>(null);
  const [libraryName, setLibraryName] = useState('');
  const [totalSeats, setTotalSeats] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isSavingShifts, setIsSavingShifts] = useState(false);


  const fetchSettings = useCallback(async (currentUser: User) => {
    setLoading(true);
    try {
      const { data: libraryData, error: libraryError } = await supabase
        .from('libraries')
        .select('id, name, total_seats')
        .eq('owner_id', currentUser.id)
        .single();

      if (libraryError && libraryError.code !== 'PGRST116') {
        throw libraryError;
      }

      if (libraryData) {
        setLibraryId(libraryData.id);
        setLibraryName(libraryData.name || '');
        setTotalSeats(libraryData.total_seats);

        const { data: shiftsData, error: shiftsError } = await supabase
          .from('shifts')
          .select('*')
          .eq('library_id', libraryData.id)
          .order('start_time', { ascending: true });

        if (shiftsError) throw shiftsError;
        
        setShifts(shiftsData ? shiftsData.map(s => ({ ...s, fee: s.fee || 0 })) : []);
      }
    } catch (error: any) {
      toast({ title: "Error fetching settings", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
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

  const handleSaveGeneral = async () => {
    if (!user) {
      toast({ title: "You must be logged in to save settings.", variant: "destructive" });
      return;
    }
    setIsSavingGeneral(true);
    try {
      let currentLibraryId = libraryId;
      if (!currentLibraryId) {
        const { data, error } = await supabase
          .from('libraries')
          .insert({ owner_id: user.id, name: libraryName, total_seats: totalSeats })
          .select('id')
          .single();
        if (error || !data) throw error || new Error("Failed to create library.");
        currentLibraryId = data.id;
        setLibraryId(currentLibraryId);
      } else {
        const { error } = await supabase.from('libraries').update({ name: libraryName, total_seats: totalSeats }).eq('id', currentLibraryId);
        if (error) throw error;
      }
      const { error: profileError } = await supabase.from('profiles').update({ library_name: libraryName }).eq('id', user.id);
      if (profileError) throw profileError;
      toast({ title: "General Settings Saved", description: "Library details have been updated." });
    } catch (error: any) {
      toast({ title: "Error Saving General Settings", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleRemoveShift = (shiftId: number | string) => {
    console.log("this si the shift id which is been deleted", shiftId)

    // Remove the shift from the UI immediately
    setShifts(prev => prev.filter(s => s.id !== shiftId));
  };
  
  const handleSaveShifts = async () => {
    if (!user || !libraryId) {
      toast({ title: "Cannot save shifts", description: "Please save general settings first.", variant: "destructive" });
      return;
    }
    setIsSavingShifts(true);

    try {

      // 2. Handle Inserts and Updates
      const shiftsToInsert = shifts
        .filter(s => typeof s.id === 'string' && s.id.startsWith('new-'))
        .map(({ id, ...rest }) => ({ ...rest, library_id: libraryId }));

      const shiftsToUpdate = shifts.filter(s => typeof s.id === 'number');
      
      if (shiftsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(shiftsToInsert);
        if (insertError) throw insertError;
      }
      
      if (shiftsToUpdate.length > 0) {
        // Use upsert for updates to be safe
        const { error: updateError } = await supabase.from('shifts').upsert(shiftsToUpdate);
        if (updateError) throw updateError;
      }
      
      toast({ title: "Shifts Saved", description: "Your shifts have been successfully updated." });
      
      fetchSettings(user);

    } catch (error: any) {
      toast({ title: "Error Saving Shifts", description: error.message, variant: "destructive" });
    } finally {
      setIsSavingShifts(false);
    }
  };

  return {
    loading,
    libraryName,
    setLibraryName,
    totalSeats,
    setTotalSeats,
    isSavingGeneral,
    handleSaveGeneral,
    shifts,
    setShifts,
    libraryId,
    isSavingShifts,
    handleSaveShifts,
    handleRemoveShift,
    toast
  };
}
