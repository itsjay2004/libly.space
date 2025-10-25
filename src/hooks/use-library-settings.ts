
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// WIP: implemet toast in the logic
export function useLibrarySettings() {
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [libraryIdState, setLibraryIdState] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  const getLibrarySettings = async (user: User) => {
    const { data: libraryData, error: libraryError } = await supabase
      .from('libraries')
      .select('id, name, total_seats')
      .eq('owner_id', user.id)
      .single();

    if (libraryError && libraryError.code !== 'PGRST116') {
      throw libraryError;
    }

    let libraryName = '';
    let totalSeats = 0;
    let shifts: Shift[] = [];
    let libraryId = null;

    if (libraryData) {
      libraryId = libraryData.id;
      libraryName = libraryData.name || '';
      totalSeats = libraryData.total_seats;

      const { data: shiftsData, error: shiftsError } = await supabase
        .from('shifts')
        .select('*')
        .eq('library_id', libraryData.id)
        .order('start_time', { ascending: true });

      if (shiftsError) throw shiftsError;
      
      shifts = shiftsData ? shiftsData.map(s => ({ ...s, fee: s.fee || 0 })) : [];
    }

    return { libraryId, libraryName, totalSeats, shifts };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['librarySettings', currentUser?.id],
    queryFn: () => getLibrarySettings(currentUser!),
    enabled: !!currentUser,
  });

  const [libraryName, setLibraryName] = useState('');
  const [totalSeats, setTotalSeats] = useState(0);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [originalShifts, setOriginalShifts] = useState<Shift[]>([]);

  useEffect(() => {
    if (data) {
      setLibraryName(data.libraryName);
      setTotalSeats(data.totalSeats);
      setShifts(data.shifts);
      setOriginalShifts(data.shifts); // Keep a copy of the original
      setLibraryIdState(data.libraryId);
    }
  }, [data]);

  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async ({ name, seats }: { name: string, seats: number }) => {
      if (!currentUser) {
        throw new Error("You must be logged in to save settings.");
      }

      let currentLibraryId = libraryIdState;
      if (!currentLibraryId) {
        const { data, error } = await supabase
          .from('libraries')
          .insert({ owner_id: currentUser.id, name: name, total_seats: seats })
          .select('id')
          .single();
        if (error || !data) throw error || new Error("Failed to create library.");
        currentLibraryId = data.id;
        setLibraryIdState(currentLibraryId);
      } else {
        const { error } = await supabase.from('libraries').update({ name: name, total_seats: seats }).eq('id', currentLibraryId);
        if (error) throw error;
      }
      const { error: profileError } = await supabase.from('profiles').update({ library_name: name }).eq('id', currentUser.id);
      if (profileError) throw profileError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarySettings', currentUser?.id] });
      toast({ title: "General Settings Saved", description: "Library details have been updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error Saving General Settings", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveGeneral = () => {
    saveGeneralSettingsMutation.mutate({ name: libraryName, seats: totalSeats });
  };
  
  const saveShiftsMutation = useMutation({
    mutationFn: async (currentShifts: Shift[]) => {
      if (!currentUser || !libraryIdState) {
        throw new Error("Cannot save shifts. Please save general settings first.");
      }

      // 1. Find new shifts to INSERT
      const shiftsToInsert = currentShifts
        .filter(s => typeof s.id === 'string' && s.id.startsWith('new-'))
        .map(({ id, ...rest }) => ({ ...rest, library_id: libraryIdState }));

      // 2. Find deleted shifts to DELETE
      const currentShiftIds = new Set(currentShifts.map(s => s.id));
      // console.log("---------------------", currentShiftIds)
      const deletedShiftIds = originalShifts
        .filter(s => !currentShiftIds.has(s.id))
        .map(s => s.id);

        console.log("--0-0-0---------", deletedShiftIds)

      // 3. Find modified shifts to UPDATE
      const originalShiftsMap = new Map(originalShifts.map(s => [s.id, s]));
      const shiftsToUpdate = currentShifts.filter(current => {
        if (typeof current.id === 'string' && current.id.startsWith('new-')) {
          return false;
        }
        const original = originalShiftsMap.get(current.id);
        if (!original) {
          return false;
        }
        return current.name !== original.name ||
               current.start_time !== original.start_time ||
               current.end_time !== original.end_time ||
               current.fee !== original.fee;
      });

      const promises = [];

      if (shiftsToInsert.length > 0) {
        promises.push(supabase.from('shifts').insert(shiftsToInsert));
      }
      if (deletedShiftIds.length > 0) {
        promises.push(supabase.from('shifts').delete().in('id', deletedShiftIds as any));
      }
      if (shiftsToUpdate.length > 0) {
        promises.push(supabase.from('shifts').upsert(shiftsToUpdate));
      }

      if (promises.length === 0) {
        toast({ title: "No Changes", description: "There were no changes to save." });
        return;
      }

      const results = await Promise.all(promises);
      
      for (const result of results) {
        if (result.error) {
          throw result.error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['librarySettings', currentUser?.id] });
      toast({ title: "Shifts Saved", description: "Your shifts have been successfully updated." });
    },
    onError: (error: any) => {
      toast({ title: "Error Saving Shifts", description: error.message, variant: "destructive" });
    }
  });

  const handleSaveShifts = () => {
    saveShiftsMutation.mutate(shifts);
  };

  const handleRemoveShift = (shiftId: number | string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId));
    toast({ title: "Shift Marked for Deletion", description: "Click 'Save Shifts' to confirm the removal." });
  };
  
  return {
    loading: isLoading || !currentUser,
    libraryName,
    setLibraryName,
    totalSeats,
    setTotalSeats,
    isSavingGeneral: saveGeneralSettingsMutation.isPending,
    handleSaveGeneral,
    shifts,
    setShifts,
    libraryId: libraryIdState,
    isSavingShifts: saveShiftsMutation.isPending,
    handleSaveShifts,
    handleRemoveShift,
    toast
  };
}
