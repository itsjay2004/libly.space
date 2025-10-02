"use client";

import { useRouter } from 'next/navigation';
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { students } from "@/lib/data";

export default function StudentLookup() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState('');

  const handleSelect = (studentId: string) => {
    router.push(`/dashboard/students/${studentId}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Student Lookup</CardTitle>
        <CardDescription>Search for a student to quickly view their profile.</CardDescription>
      </CardHeader>
      <CardContent>
        <Command shouldFilter={true} className="w-full">
          <CommandInput 
            placeholder="Search by name or phone..." 
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onValueChange={setValue}
          />
          {open && value.length > 0 && (
            <CommandList>
              <CommandEmpty>No student found.</CommandEmpty>
              <CommandGroup>
                {students.map((student) => (
                  <CommandItem
                    key={student.id}
                    value={`${student.name} ${student.phone}`}
                    onSelect={() => handleSelect(student.id)}
                    className="cursor-pointer"
                  >
                    <div className="flex justify-between w-full">
                      <div>
                        <p>{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.phone}</p>
                      </div>
                      {student.seatNumber && <p className="text-sm text-muted-foreground">Seat #{student.seatNumber}</p>}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </CardContent>
    </Card>
  );
}
