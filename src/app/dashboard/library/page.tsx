'use client';

import { useLibrarySettings } from '@/hooks/use-library-settings';
import { GeneralSettings } from '@/components/dashboard/GeneralSettings';
import { ShiftManagement } from '@/components/dashboard/ShiftManagement';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useEffect } from "react"


export default function SettingsPage() {
  const {
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
  } = useLibrarySettings();

  useEffect(() => {
    document.title = `Library - Libly Space`;
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="library-name"><Skeleton className="h-4 w-24" /></Label>
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid gap-2 max-w-sm">
                  <Label htmlFor="total-seats"><Skeleton className="h-4 w-24" /></Label>
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
              <CardDescription><Skeleton className="h-4 w-64" /></CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 p-4 border rounded-lg">
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <Skeleton className="h-10 w-36" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-6">
        <GeneralSettings
          libraryName={libraryName}
          setLibraryName={setLibraryName}
          totalSeats={totalSeats}
          setTotalSeats={setTotalSeats}
          isSaving={isSavingGeneral}
          onSave={handleSaveGeneral}
        />
        <ShiftManagement
          shifts={shifts}
          setShifts={setShifts}
          libraryId={libraryId}
          isSaving={isSavingShifts}
          onSave={handleSaveShifts}
          onRemove={handleRemoveShift}
          toast={toast}
        />
      </div>
    </div>
  );
}
