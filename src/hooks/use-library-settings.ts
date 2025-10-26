"use client";

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { Shift } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useUser } from './use-user';

// --- Fetcher Functions ---
async function fetchLibraryData(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from('libraries')
    .select('id, name, total_seats')
    .eq('owner_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function fetchShifts(supabase: any, libraryId: string | null) {
  if (!libraryId) return [];
  const { data, error } = await supabase.from('shifts').select('*').eq('library_id', libraryId);
  if (error) throw error;
  return data || [];
}

// --- Custom Hook ---
export function useLibrarySettings() {
  const supabase = createClient();
  const { user: currentUser } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [libraryName, setLibraryName] = useState('');
  const [totalSeats, setTotalSeats] = useState<number | string>('');
  const [shifts, setShifts] = useState<Partial<Shift>[]>([]);
  
  const userId = currentUser?.id;

  // --- QUERIES ---
  const { data: libraryData, isLoading: isLibraryLoading } = useQuery({
    queryKey: ['library', userId],
    queryFn: () => fetchLibraryData(supabase, userId!),
    enabled: !!userId,
  });

  const libraryId = libraryData?.id;

  const { data: initialShifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shifts', libraryId],
    queryFn: () => fetchShifts(supabase, libraryId),
    enabled: !!libraryId,
  });

  // --- State Synchronization ---
  useEffect(() => {
    if (libraryData) {
      setLibraryName(libraryData.name || '');
      setTotalSeats(libraryData.total_seats || '');
    }
  }, [libraryData]);

  useEffect(() => {
    setShifts(initialShifts);
  }, [initialShifts]);

  // --- MUTATIONS ---
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async ({ name, seats }: { name: string; seats: number }) => {
      if (!userId) throw new Error("User not found.");
      const { data, error } = await supabase.from('libraries').upsert({
        id: libraryId || undefined,
        owner_id: userId,
        name,
        total_seats: seats,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', userId] });
      toast({ title: "Success", description: "General settings have been saved." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Could not save settings: ${error.message}`, variant: "destructive" });
    },
  });

  const saveShiftsMutation = useMutation({
    mutationFn: async (shiftsToSave: Partial<Shift>[]) => {
      if (!libraryId) throw new Error("Library ID is missing.");

      const newShifts = shiftsToSave
        .filter(s => typeof s.id === 'string' && s.id.startsWith('temp-'))
        .map(({ name, start_time, end_time, fee }) => ({
          library_id: libraryId,
          name,
          start_time,
          end_time,
          fee,
        }));

      const existingShifts = shiftsToSave
        .filter(s => typeof s.id === 'string' && !s.id.startsWith('temp-'))
        .map(({ id, name, start_time, end_time, fee }) => ({
          id,
          library_id: libraryId,
          name,
          start_time,
          end_time,
          fee,
        }));

      const operations = [];

      if (newShifts.length > 0) {
        operations.push(supabase.from('shifts').insert(newShifts));
      }
      
      if (existingShifts.length > 0) {
        operations.push(supabase.from('shifts').upsert(existingShifts));
      }

      const results = await Promise.all(operations);
      const firstError = results.find(res => res.error);
      if (firstError) throw firstError.error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shifts', libraryId] });
      toast({ title: "Success", description: "Shift information has been updated." });
    },
    onError: (error) => {
      toast({ title: "Error saving shifts", description: error.message, variant: 'destructive' });
    }
  });

  const deleteShiftMutation = useMutation({
      mutationFn: async (shiftId: string) => {
          const { data, error: fetchError } = await supabase.from('students').select('id').eq('shift_id', shiftId).limit(1);
          if(fetchError) throw new Error(`Could not verify shift status: ${fetchError.message}`);
          if (data && data.length > 0) {
            throw new Error("This shift cannot be deleted because it is currently assigned to one or more students.");
          }
          const { error } = await supabase.from('shifts').delete().match({ id: shiftId });
          if (error) throw error;
      },
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['shifts', libraryId] });
          toast({ title: "Shift Deleted", description: "The shift has been successfully removed." });
      },
      onError: (error) => {
          toast({ title: "Error", description: `Could not delete shift: ${error.message}`, variant: "destructive" });
      }
  });

  // --- Event Handlers ---
  const handleSaveGeneral = () => {
    const seats = Number(totalSeats);
    if (!libraryName.trim() || isNaN(seats) || seats <= 0) {
      toast({ title: "Invalid Input", description: "Please provide a valid library name and a positive number for seats.", variant: "destructive" });
      return;
    }
    saveGeneralSettingsMutation.mutate({ name: libraryName, seats });
  };
  
  const handleSaveShifts = () => {
    saveShiftsMutation.mutate(shifts);
  };

  const handleRemoveShift = (shiftId: string) => {
    deleteShiftMutation.mutate(shiftId);
  };
  
  return {
    loading: isLibraryLoading || isShiftsLoading,
    libraryName,
    setLibraryName,
    totalSeats,
    setTotalSeats,
    isSavingGeneral: saveGeneralSettingsMutation.isPending,
    handleSaveGeneral,
    shifts,
    setShifts,
    libraryId,
    isSavingShifts: saveShiftsMutation.isPending,
    handleSaveShifts,
    handleRemoveShift,
    isDeletingShift: deleteShiftMutation.isPending,
    toast
  };
}
