'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UpdatePasswordForm({
  onSubmit,
  loading,
  error,
}: {
  onSubmit: (password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters.');
      return;
    }
    await onSubmit(password);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {error && <p className="text-red-500">{error}</p>}
      {localError && <p className="text-red-500">{localError}</p>}
      <Input
        type="password"
        placeholder="New Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input"
      />
      <Input
        type="password"
        placeholder="Confirm New Password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        className="input"
      />
      <Button type="submit" disabled={loading} className="button">
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
}
