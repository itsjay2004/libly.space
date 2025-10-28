'use client';

import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import UpdatePasswordForm from './update-password-form';
import { useState } from 'react';

export default function SecuritySettings() {
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  const handleUpdatePassword = async (password: string) => {
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
    } else {
      toast({
        title: "Success",
        description: "Your password has been updated.",
      });
      setIsPasswordDialogOpen(false);
    }
    setLoading(false);
  };

  return (
    <Card className="shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">Security</CardTitle>
        <CardDescription className="text-gray-600 dark:text-white mt-1">Manage your account security.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 text-gray-700">
        <div className="flex justify-between items-center border-b pb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white/70">Password</h3>
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors rounded-md px-4 py-2">Change Password</Button>
            </DialogTrigger>
            <DialogContent className="bg-white rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold text-gray-800">Update Your Password</DialogTitle>
              </DialogHeader>
              <UpdatePasswordForm onSubmit={handleUpdatePassword} loading={loading} error={error} />
            </DialogContent>
          </Dialog>
        </div>
        <div className="flex justify-between items-center">
            <div>
                <h3 className="font-semibold text-gray-900 dark:text-white/70">Logout</h3>
                <p className="text-gray-600 text-sm">You will be returned to the login screen.</p>
            </div>
            <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="bg-red-600 text-white hover:bg-red-700 transition-colors rounded-md px-4 py-2"
                >
                  Logout
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure you want to logout?</DialogTitle>
                  <DialogDescription>
                    You will be redirected to the login page.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsLogoutDialogOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={handleLogout}>Logout</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}
