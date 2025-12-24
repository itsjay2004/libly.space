'use client'

import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormEvent, useState } from 'react';
import Footer from "@/components/footer"
import { CustomLink } from '@/components/ui/custom-link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: process.env.NEXT_PUBLIC_RESET_REDIRECT,
      });

      if (authError) {
        setError(authError.message);
      } else {
        setMessage('Check your email you will receive a password reset link!');
      }
    } catch (err) {
        setError('An unexpected error occurred.');
        console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Card className="mx-auto w-full max-w-sm">
          <CardHeader>
            <CardTitle className="text-2xl">Forgot Password</CardTitle>
            <CardDescription>
              Enter your email below to receive a password reset link.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword}>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Sending reset link...' : 'Reset Password'}
                </Button>
              </div>
            </form>
            {message && <p className="mt-4 text-center text-sm text-green-500">{message}</p>}
            {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
            <div className="mt-4 text-center text-sm">
              Remember your password?{' '}
              <CustomLink href="/login" className="underline">
                Login
              </CustomLink>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
