'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/hooks/use-user';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function UpdateProfileForm({ onSuccess }: { onSuccess: () => void; }) {
  const { user, isLoading: userLoading, userDetails, refreshUserDetails } = useUser();
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const supabase = createClient();

  useEffect(() => {
    if (userDetails) {
      setFullName(userDetails.full_name || '');
      setPhone(userDetails.phone || '');
    }
  }, [userDetails]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    if (!user) {
        setError('You must be logged in to update your profile.');
        setLoading(false);
        return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: fullName,
        phone: phone,
      })
      .eq('id', user.id);

    if (error) {
      setError('Error updating profile: ' + error.message);
    } else {
      setMessage('Profile updated successfully!');
      refreshUserDetails(); // Refresh user details after update
      onSuccess(); // Close the dialog
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleUpdateProfile} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="full-name">Full Name</Label>
        <Input
          id="full-name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          disabled={userLoading || loading}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          disabled={userLoading || loading}
        />
      </div>
      <Button type="submit" className="w-full" disabled={userLoading || loading}>
        {loading ? 'Saving...' : 'Save Changes'}
      </Button>
      {message && <p className="text-sm text-center mt-2 text-green-600">{message}</p>}
      {error && <p className="text-sm text-center mt-2 text-red-600">{error}</p>}
    </form>
  );
}
