
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

const Ready = () => {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 7000); // Redirect after 7 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <Card className="w-full text-center py-12">
      <CardHeader className="flex flex-col items-center">
        <CheckCircle className="h-20 w-20 text-primary mb-4 animate-bounce" /> {/* Larger icon with bounce animation */}
        <CardTitle className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-2">
          Congratulations! You're All Set!
        </CardTitle>
        <CardDescription className="mt-2 text-xl text-gray-700 dark:text-gray-300">
          Your library is now fully configured and ready to welcome students.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6">
        <p className="text-lg text-muted-foreground">
          You'll be automatically redirected to your dashboard in a moment...
        </p>
      </CardContent>
    </Card>
  );
};

export default Ready;
