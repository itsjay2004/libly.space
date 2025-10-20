'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface GeneralSettingsProps {
  libraryName: string;
  setLibraryName: (name: string) => void;
  totalSeats: number;
  setTotalSeats: (seats: number) => void;
  isSaving: boolean;
  onSave: () => void;
}

export function GeneralSettings({
  libraryName,
  setLibraryName,
  totalSeats,
  setTotalSeats,
  isSaving,
  onSave,
}: GeneralSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>General Configuration</CardTitle>
        <CardDescription>Set the name and total number of seats in your library.</CardDescription>
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
              disabled={isSaving}
            />
          </div>
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="total-seats">Total Seats</Label>
            <Input
              id="total-seats"
              type="number"
              value={totalSeats}
              onChange={(e) => setTotalSeats(Number(e.target.value))}
              disabled={isSaving}
            />
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save General Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
