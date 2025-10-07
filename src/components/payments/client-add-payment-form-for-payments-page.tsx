"use client";

import { useState, useEffect, useCallback } from 'react';
import AddPaymentForm from "./add-payment-form";
import { createClient } from '@/lib/supabase/client';
import type { Student } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation'; // Import useRouter
import { Skeleton } from '@/components/ui/skeleton';

export default function ClientAddPaymentFormForPaymentsPage({ libraryId }: { libraryId: string }) {
  const supabase = createClient();
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Initialize router

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('students')
      .select('id, name, phone')
      .eq('library_id', libraryId);

    if (error) {
      toast({ title: "Error fetching students", description: error.message, variant: "destructive" });
      setStudents([]);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  }, [supabase, libraryId, toast]);

  useEffect(() => {
    if (libraryId) {
      fetchStudents();
    }
  }, [libraryId, fetchStudents]);

  const handlePaymentSuccess = () => {
    router.refresh(); // Refresh the current route to re-fetch server-side data
  };

  if (loading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <AddPaymentForm 
      libraryId={libraryId} 
      students={students} 
      onPaymentSuccess={handlePaymentSuccess} // Pass the new handler
    />
  );
}
