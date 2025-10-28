'use client';

import { useState } from 'react';
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import UpdateProfileForm from './update-profile-form';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileDetails() {
  const { user, userDetails, isLoading } = useUser();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (isLoading) {
    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-6 w-24 mb-1" />
                        <Skeleton className="h-4 w-48" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 text-gray-700">
                <div className="flex justify-between items-center border-b pb-4">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex justify-between items-center border-b pb-4">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex justify-between items-center">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-28" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">Profile</CardTitle>
            <CardDescription className="text-gray-600 dark:text-white/70 mt-1">Your personal information.</CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md px-4 py-2">Edit Profile</Button>
            </DialogTrigger>
            <DialogContent className="rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-800">Update Your Profile</DialogTitle>
              </DialogHeader>
              <UpdateProfileForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6 text-gray-700">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Full Name</h3>
          <p className="text-gray-800 dark:text-white">{userDetails?.full_name || 'Not set'}</p>
        </div>
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Email</h3>
          <p className="text-gray-800 dark:text-white">{user?.email}</p>
        </div>
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900 dark:text-white">Phone</h3>
          <p className="text-gray-800 dark:text-white">{userDetails?.phone || 'Not set'}</p>
        </div>
      </CardContent>
    </Card>
  );
}
