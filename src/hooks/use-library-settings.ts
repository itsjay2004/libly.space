
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { User } from '@supabase/supabase-js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useLibrarySettings() {
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [libraryIdState, setLibraryIdState] = useState<string | null>(null); // Local state for libraryId

  // Fetch current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, [supabase]);

  // Query function to fetch library settings
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

  // TanStack Query for library settings
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['librarySettings', currentUser?.id],
    queryFn: () => getLibrarySettings(currentUser!),
    enabled: !!currentUser, // Only run query if user is available
  });

  // Local state for form inputs, initialized from query data
  const [libraryName, setLibraryName] = useState(data?.libraryName || '');
  const [totalSeats, setTotalSeats] = useState(data?.totalSeats || 0);
  const [shifts, setShifts] = useState<Shift[]>(data?.shifts || []);

  useEffect(() => {
    if (data) {
      setLibraryName(data.libraryName);
      setTotalSeats(data.totalSeats);
      setShifts(data.shifts);
      setLibraryIdState(data.libraryId);
    }
  }, [data]);

  // Mutation for saving general settings
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
        setLibraryIdState(currentLibraryId); // Update local state
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

  // Mutation for saving shifts
  const saveShiftsMutation = useMutation({
    mutationFn: async (shiftsToSave: Shift[]) => {
      if (!currentUser || !libraryIdState) {
        throw new Error("Cannot save shifts. Please save general settings first.");
      }

      const shiftsToInsert = shiftsToSave
        .filter(s => typeof s.id === 'string' && s.id.startsWith('new-'))
        .map(({ id, ...rest }) => ({ ...rest, library_id: libraryIdState }));

      const shiftsToUpdate = shiftsToSave.filter(s => typeof s.id === 'number');
      
      if (shiftsToInsert.length > 0) {
        const { error: insertError } = await supabase.from('shifts').insert(shiftsToInsert);
        if (insertError) throw insertError;
      }
      
      if (shiftsToUpdate.length > 0) {
        const { error: updateError } = await supabase.from('shifts').upsert(shiftsToUpdate);
        if (updateError) throw updateError;
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

  // Mutation for removing a shift
  const removeShiftMutation = useMutation({
    mutationFn: async (shiftId: number | string) => {
      if (!libraryIdState) {
        throw new Error("Library not loaded. Cannot remove shift.");
      }
      if (typeof shiftId === 'number') { // Only delete from DB if it's an existing shift
        const { error } = await supabase.from('shifts').delete().eq('id', shiftId).eq('library_id', libraryIdState);
        if (error) throw error;
      }
    },
    onSuccess: (_, shiftId) => {
      queryClient.invalidateQueries({ queryKey: ['librarySettings', currentUser?.id] });
      setShifts(prev => prev.filter(s => s.id !== shiftId)); // Optimistic update
      toast({ title: "Shift Removed", description: "Shift has been successfully removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error Removing Shift", description: error.message, variant: "destructive" });
    }
  });

  const handleRemoveShift = (shiftId: number | string) => {
    setShifts(prev => prev.filter(s => s.id !== shiftId)); // Optimistic UI update
    removeShiftMutation.mutate(shiftId);
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
    toast,
    error // Expose error from query
  };
}
