"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Student, Shift } from '@/lib/types';
import { checkOverlap } from '@/lib/time-utils';
import { useQuery } from '@tanstack/react-query';
import { User } from '@supabase/supabase-js';

// --- Fetcher Functions ---

async function fetchLibrary(supabase: any, user: User | null) {
  if (!user) return null;
  const { data, error } = await supabase
    .from('libraries')
    .select('id, total_seats')
    .eq('owner_id', user.id)
    .single();
  // Don't throw for "no rows found", as it's a valid state
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

async function fetchShifts(supabase: any, libraryId: string | null) {
  if (!libraryId) return [];
  const { data, error } = await supabase.from('shifts').select('*').eq('library_id', libraryId);
  if (error) throw error;
  return data || [];
}

// Reverted to fetching the entire student table for the library
async function fetchStudents(supabase: any, libraryId: string | null) {
    if (!libraryId) return [];
    const { data, error } = await supabase
      .from('students')
      .select('*, shifts(name, start_time, end_time)')
      .eq('library_id', libraryId);
    if (error) throw error;
    return data || [];
}

// --- Custom Hook ---

export function useSeatManagement(user: User | null) {
  const supabase = createClient();
  
  const [selectedShift, setSelectedShift] = useState<string | undefined>(undefined);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);

  // --- Queries with Caching ---

  const { data: library, isLoading: isLibraryLoading } = useQuery({
    queryKey: ['library', user?.id],
    queryFn: () => fetchLibrary(supabase, user),
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
  const libraryId = library?.id;

  const { data: shifts = [], isLoading: isShiftsLoading } = useQuery({
    queryKey: ['shifts', libraryId],
    queryFn: () => fetchShifts(supabase, libraryId),
    enabled: !!libraryId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 15,
  });

  const { data: students = [], isLoading: isStudentsLoading } = useQuery<Student[]>({
    queryKey: ['students', libraryId],
    queryFn: () => fetchStudents(supabase, libraryId),
    enabled: !!libraryId,
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  });

  // Set the default shift once shifts are loaded
  useEffect(() => {
    if (shifts.length > 0 && !selectedShift) {
      setSelectedShift(shifts[0].id);
    }
  }, [shifts, selectedShift]);
  
  // --- Business Logic ---

  const getStudentForSeat = (seatNumber: number): (Student & { shifts: Shift }) | null => {
    const currentlySelectedShift = shifts.find(s => s.id === selectedShift);
    if (!currentlySelectedShift) return null;

    const overlappingStudents = students.filter(student => {
      if (student.seat_number !== seatNumber || !student.shift_id || !student.shifts) return false;
      
      const studentShift = student.shifts as unknown as Shift;
       if (!studentShift) return false;

      return checkOverlap(
        currentlySelectedShift.start_time,
        currentlySelectedShift.end_time,
        studentShift.start_time,
        studentShift.end_time
      );
    });

    return overlappingStudents.length > 0 ? overlappingStudents[0] as Student & { shifts: Shift } : null;
  };

  const studentForSelectedSeat = selectedSeat ? getStudentForSeat(selectedSeat) : null;

  const handleSeatClick = (seatNumber: number) => {
    setSelectedSeat(seatNumber);
    setIsModalOpen(true);
  };
  
  const loading = isLibraryLoading || isShiftsLoading || isStudentsLoading;

  return {
    loading,
    library,
    totalSeats: library?.total_seats || 0,
    shifts,
    students, // Pass the full students list
    selectedShift,
    setSelectedShift,
    isModalOpen,
    setIsModalOpen,
    selectedSeat,
    studentForSelectedSeat,
    handleSeatClick,
    getStudentForSeat, // Added the missing function
  };
}
