
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/onboarding/progress-bar';
import LibrarySetup from '@/components/onboarding/library-setup';
import StudentImport from '@/components/onboarding/student-import';
import Ready from '@/components/onboarding/ready';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Import CardDescription
import type { Metadata } from 'next';

const metadata = {
  title: 'Onboarding - libly.space',
};

const OnboardingPage = () => {
  const { user, userDetails, isLoading: isUserHookLoading, refresh: refreshUserHook } = useUser();
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    if (!isUserHookLoading && userDetails) {
      setOnboardingStatus(userDetails.onboarding_status);
    } else if (!isUserHookLoading && !user) {
      router.push('/login');
    }
  }, [isUserHookLoading, user, userDetails, router]);

  useEffect(() => {
    if (onboardingStatus === 'completed') {
      router.push('/dashboard');
    }
  }, [onboardingStatus, router]);

  const updateOnboardingStatus = async (status: string) => {
    if (!user || !user.id) {
      console.error("updateOnboardingStatus: User or user.id is null/undefined. Cannot proceed.", user);
      return; 
    }

    const { error } = await supabase
      .from('profiles')
      .update({ onboarding_status: status })
      .eq('id', user.id);

    if (error) {
      console.error('Error updating onboarding status in DB:', error);
    } else {
      refreshUserHook();
    }
  };

  if (isUserHookLoading || !onboardingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl space-y-8">
          <div className="text-center">
            <Skeleton className="h-10 w-3/4 mx-auto mb-4" />
            <Skeleton className="h-6 w-1/2 mx-auto" />
          </div>
          <div className="flex justify-between items-center py-4">
            {[1, 2, 3].map((_, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center gap-2">
                  <Skeleton className="rounded-full h-10 w-10" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {index < 2 && (
                  <Skeleton className="flex-1 h-1 bg-gray-300 dark:bg-gray-700 mx-2" />
                )}
              </React.Fragment>
            ))}
          </div>
          <Card className="w-full">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-1/2" />
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-3/4" />
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-end">
                <Skeleton className="h-10 w-32" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const renderStep = () => {
    switch (onboardingStatus) {
      case 'step1':
        return <LibrarySetup updateOnboardingStatus={updateOnboardingStatus} />;
      case 'step2':
        return <StudentImport updateOnboardingStatus={updateOnboardingStatus} />;
      case 'importing':
        return <Ready />;
      default:
        return <div>Unknown step</div>;
    }
  };

  const getCurrentStepNumber = () => {
    switch (onboardingStatus) {
      case 'step1':
        return 1;
      case 'step2':
        return 2;
      case 'importing':
        return 3;
      default:
        return 0;
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-4xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-50 sm:text-4xl">
            Welcome Aboard! Let's Get Your Library Set Up.
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            This quick setup will guide you through the essential steps to configure your new library space.
          </p>
        </div>
        <ProgressBar currentStep={getCurrentStepNumber()} />
        <div className="mt-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;
