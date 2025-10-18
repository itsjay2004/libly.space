
'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Ready = () => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const totalTime = 7000; // 7 seconds
    const intervalTime = 70; // Update every 70ms for smooth animation

    const timer = setTimeout(() => {
      handleRedirect();
    }, totalTime);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (intervalTime / totalTime) * 100;
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, intervalTime);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [router]);

  const handleRedirect = () => {
    setIsRedirecting(true);
    router.push('/dashboard');
  };

  return (
    <Card className="w-full text-center py-12">
      <CardHeader className="flex flex-col items-center">
        <CheckCircle className="h-20 w-20 text-primary mb-4 animate-bounce" />
        <CardTitle className="text-4xl font-extrabold text-gray-900 dark:text-gray-50 mb-2">
          Congratulations! You're All Set!
        </CardTitle>
        <CardDescription className="mt-2 text-xl text-gray-700 dark:text-gray-300">
          Your library is now fully configured. If you uploaded a student list, we're processing it in the background.
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-6 flex flex-col items-center gap-6">
        <div className="w-full max-w-sm">
           <Progress value={progress} className="w-full" />
           <p className="text-sm text-muted-foreground mt-2">
                Redirecting to your dashboard...
            </p>
        </div>
        <Button onClick={handleRedirect} disabled={isRedirecting} size="lg">
          {isRedirecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isRedirecting ? 'Redirecting...' : 'Go to Dashboard Now'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default Ready;
