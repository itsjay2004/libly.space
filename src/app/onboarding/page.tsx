
'use client';

import React, { useState, useEffect } from 'react';
import { useUser } from '@/hooks/use-user';
import { createClient } from '@/lib/supabase/client'; // Use createClient from your local file
import { useRouter } from 'next/navigation';
import ProgressBar from '@/components/onboarding/progress-bar';
import LibrarySetup from '@/components/onboarding/library-setup';
import StudentImport from '@/components/onboarding/student-import';
import Ready from '@/components/onboarding/ready';

const OnboardingPage = () => {
  const { user, userDetails, isLoading: isUserHookLoading } = useUser();
  const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
  const router = useRouter();
  // Removed: const supabase = createClientComponentClient(); // No longer needed here

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
    console.log("updateOnboardingStatus called with status:", status, "for user:", user?.id);
    if (user && user.id) {
      const supabaseClientForUpdate = createClient(); // Create a fresh client for the update
      const { error } = await supabaseClientForUpdate
        .from('profiles')
        .update({ onboarding_status: status })
        .eq('id', user.id);
      if (error) {
        console.error('Error updating onboarding status in DB:', error);
      } else {
        console.log("DB status updated successfully to:", status);
        setOnboardingStatus(status);
      }
    } else {
      console.error("updateOnboardingStatus: User or user.id is null/undefined. Cannot update status.", user);
    }
  };

  if (isUserHookLoading || !onboardingStatus) {
    return <div>Loading onboarding...</div>;
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
    <div className="container mx-auto p-4">
      <ProgressBar currentStep={getCurrentStepNumber()} />
      <div className="mt-8">
        {renderStep()}
      </div>
    </div>
  );
};

export default OnboardingPage;
