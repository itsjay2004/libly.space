"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Shift } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "./use-user";

/* -------------------------------------------------------------------------- */
/*                                   Fetchers                                  */
/* -------------------------------------------------------------------------- */

async function fetchLibrary(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("libraries")
    .select("id, name, total_seats")
    .eq("owner_id", userId)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data;
}

async function fetchShifts(supabase: any, libraryId: string) {
  const { data, error } = await supabase
    .from("shifts")
    .select("*")
    .eq("library_id", libraryId);

  if (error) throw error;
  return data ?? [];
}

/* -------------------------------------------------------------------------- */
/*                               Custom Hook                                   */
/* -------------------------------------------------------------------------- */

export function useLibrarySettings() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  const userId = user?.id;

  /* ----------------------------- Editable State ---------------------------- */

  const [libraryName, setLibraryName] = useState("");
  const [totalSeats, setTotalSeats] = useState<number | "">("");
  const [shifts, setShifts] = useState<Partial<Shift>[]>([]);

  // Guards to prevent overwriting user edits on refetch
  const libraryInitialized = useRef(false);
  const shiftsInitialized = useRef(false);

  /* -------------------------------- Queries -------------------------------- */

  const {
    data: libraryData,
    isLoading: isLibraryLoading,
  } = useQuery({
    queryKey: ["library", userId],
    enabled: !!userId,
    queryFn: () => fetchLibrary(supabase, userId!),
  });

  const libraryId = libraryData?.id;

  const {
    data: shiftsData,
    isLoading: isShiftsLoading,
  } = useQuery({
    queryKey: ["shifts", libraryId],
    enabled: !!libraryId,
    queryFn: () => fetchShifts(supabase, libraryId!),
  });

  /* --------------------------- Sync to Local State -------------------------- */
  /*      (THIS IS THE CORRECT v5 PATTERN – intentional & safe useEffect)      */

  useEffect(() => {
    if (!libraryData || libraryInitialized.current) return;

    setLibraryName(libraryData.name ?? "");
    setTotalSeats(libraryData.total_seats ?? "");
    libraryInitialized.current = true;
  }, [libraryData]);

  useEffect(() => {
    if (!shiftsData || shiftsInitialized.current) return;

    setShifts(shiftsData);
    shiftsInitialized.current = true;
  }, [shiftsData]);

  /* -------------------------------- Mutations ------------------------------- */

  const saveGeneralMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("User not found.");

      const seats = Number(totalSeats);
      if (!libraryName.trim() || isNaN(seats) || seats <= 0) {
        throw new Error("Invalid library name or seat count.");
      }

      const { error } = await supabase.from("libraries").upsert({
        id: libraryId,
        owner_id: userId,
        name: libraryName.trim(),
        total_seats: seats,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["library", userId] });
      toast({ title: "Success", description: "Library settings saved." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const saveShiftsMutation = useMutation({
    mutationFn: async () => {
      if (!libraryId) throw new Error("Library ID missing.");

      const newShifts = shifts
        .filter((s) => s.id?.startsWith("temp-"))
        .map(({ name, start_time, end_time, fee }) => ({
          library_id: libraryId,
          name,
          start_time,
          end_time,
          fee,
        }));

      const existingShifts = shifts
        .filter((s) => s.id && !s.id.startsWith("temp-"))
        .map(({ id, name, start_time, end_time, fee }) => ({
          id,
          library_id: libraryId,
          name,
          start_time,
          end_time,
          fee,
        }));

      if (newShifts.length) {
        const { error } = await supabase.from("shifts").insert(newShifts);
        if (error) throw error;
      }

      if (existingShifts.length) {
        const { error } = await supabase.from("shifts").upsert(existingShifts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", libraryId] });
      shiftsInitialized.current = false; // allow resync
      toast({ title: "Success", description: "Shifts saved successfully." });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { data } = await supabase
        .from("students")
        .select("id")
        .eq("shift_id", shiftId)
        .limit(1);

      if (data?.length) {
        throw new Error("Shift is assigned to students.");
      }

      const { error } = await supabase
        .from("shifts")
        .delete()
        .eq("id", shiftId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shifts", libraryId] });
      shiftsInitialized.current = false;
      toast({ title: "Shift deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  /* --------------------------------- API ---------------------------------- */

  return {
    loading: isLibraryLoading || isShiftsLoading,

    libraryId,
    libraryName,
    setLibraryName,
    totalSeats,
    setTotalSeats,

    shifts,
    setShifts,

    saveGeneral: () => saveGeneralMutation.mutate(),
    saveShifts: () => saveShiftsMutation.mutate(),
    deleteShift: (id: string) => deleteShiftMutation.mutate(id),

    isSavingGeneral: saveGeneralMutation.isPending,
    isSavingShifts: saveShiftsMutation.isPending,
    isDeletingShift: deleteShiftMutation.isPending,
  };
}