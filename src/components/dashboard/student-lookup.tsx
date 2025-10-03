"use client";

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/hooks/use-user";
import type { Student } from "@/lib/types";

export default function StudentLookup() {
  const router = useRouter();
  const [students, setStudents] = React.useState<Student[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { user, isLoading: userLoading } = useUser();

  // Using useRef to manage the debounce timeout
  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    // Clear any existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (searchTerm.trim() === '') {
      // If search term is empty, clear students and stop loading immediately
      setStudents([]);
      setLoading(false);
      setError(null);
      return; // Do not proceed with fetching
    }

    // Set a new timeout to fetch students after a delay
    debounceTimeoutRef.current = setTimeout(() => {
      if (user && !userLoading) {
        fetchStudents();
      } else if (!user && !userLoading) {
        // If user is not logged in after loading, clear students and set error
        setStudents([]);
        setError("Please log in to search for students.");
        setLoading(false);
      }
    }, 300);

    // Cleanup function to clear timeout if component unmounts or searchTerm changes
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [searchTerm, user, userLoading]);

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    
    // Ensure user is available before proceeding
    if (!user) {
        setError("User not logged in.");
        setLoading(false);
        setStudents([]);
        return;
    }

    const { data: libraryData, error: libraryError } = await supabase
      .from('libraries')
      .select('id')
      .eq('owner_id', user.id)
      .single();

    if (libraryError || !libraryData) {
      console.error("Error fetching library for student lookup:", libraryError);
      setError("Could not load students: Library not found.");
      setStudents([]);
      setLoading(false);
      return;
    }

    const libraryId = libraryData.id;
    const searchPattern = `%${searchTerm.toLowerCase()}%`; // Use current searchTerm for fetching

    const { data, error: studentsFetchError } = await supabase
      .from('students')
      .select('id, name, phone') 
      .eq('library_id', libraryId)
      .or(`name.ilike.${searchPattern},phone.ilike.${searchPattern}`)
      .order('name', { ascending: true });

    if (studentsFetchError) {
      console.error("Error fetching students:", studentsFetchError);
      setError("Failed to load students.");
      setStudents([]);
    } else {
      setStudents(data || []);
    }
    setLoading(false);
  };

  const handleSelect = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
    setSearchTerm(''); // Clear search term after selection
    setStudents([]); // Clear displayed students
  };

  return (
    <Card className="w-full"> 
      <CardHeader>
        <CardTitle>Student Lookup</CardTitle>
        <CardDescription>Search for a student by name or phone number.</CardDescription>
      </CardHeader>
      <CardContent>
        <Command shouldFilter={false}> 
          <CommandInput 
            placeholder="Search student by name or phone..." 
            value={searchTerm}
            onValueChange={setSearchTerm}
          />
          <CommandList>
            {userLoading && <p className="p-2 text-sm text-center text-muted-foreground">Loading user data...</p>}
            {!user && !userLoading && <p className="p-2 text-sm text-center text-destructive">Please log in to search for students.</p>}
            
            {loading && searchTerm.trim() !== '' && <p className="p-2 text-sm text-center text-muted-foreground">Searching...</p>}
            {error && <p className="p-2 text-sm text-center text-destructive">Error: {error}</p>}
            
            {(!loading && !error && students.length === 0 && searchTerm.trim() === '' && user && !userLoading) && <CommandEmpty>Start typing to search for students.</CommandEmpty>}
            {(!loading && !error && students.length === 0 && searchTerm.trim() !== '' && user && !userLoading) && <CommandEmpty>No students found for "{searchTerm}".</CommandEmpty>}
            
            <CommandGroup>
              {!loading && !error && students.length > 0 && students.map((student) => (
                <CommandItem
                  key={student.id}
                  value={`${student.name} ${student.phone}`}
                  onSelect={() => handleSelect(student.id)}
                >
                  {student.name} ({student.phone})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CardContent>
    </Card>
  );
}
