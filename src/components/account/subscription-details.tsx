'use client';

import { useRouter } from 'next/navigation'; // Import useRouter
import { useUser } from '@/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import PlanSelectorSheet from './plan-selector-sheet';

const FREE_PLAN_STUDENT_LIMIT = 50;

export default function SubscriptionDetails() {
  const router = useRouter(); // Initialize useRouter
  const { userDetails, studentCount, isLoading: isUserLoading, isNearingStudentLimit, isStudentLimitReached } = useUser();

  const isSubscribed = userDetails?.subscription_status === 'active';
  const isFreePlan = !isSubscribed;
  const usagePercentage = isFreePlan ? (studentCount / FREE_PLAN_STUDENT_LIMIT) * 100 : 0;

  const handleManageBillingClick = () => {
    router.push('/cart'); // Navigate to the cart page
  };

  if (isUserLoading) {
    return (
        <Card className="shadow-lg rounded-lg">
            <CardHeader>
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent className="grid gap-6">
                <div className="flex justify-between items-center border-b pb-4">
                    <div>
                        <Skeleton className="h-5 w-24 mb-2" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                    <Skeleton className="h-10 w-24 rounded-md" />
                </div>
                <div className="grid gap-3">
                    <Skeleton className="h-5 w-28" />
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-2 w-full rounded-full" />
                        <Skeleton className="h-5 w-10" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className=" shadow-lg rounded-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800 dark:text-white">Subscription</CardTitle>
        <CardDescription className="text-black dark:text-white/70 mt-1">Manage your subscription and billing details.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 text-gray-700">
        <div className="flex justify-between items-center border-b pb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Current Plan</h3>
            <Badge
              className={isSubscribed ? 'bg-green-100 dark:bg-green-500 text-green-800 dark:text-white' : 'bg-gray-100 dark:bg-gray-100 text-gray-800 dark:text-black'}
            >
              {isSubscribed ? 'Pro' : 'Free'}
            </Badge>
          </div>
          {isSubscribed ? (
            <Button 
                onClick={handleManageBillingClick} // Add onClick handler
                className="bg-gray-600 text-white hover:bg-gray-700 transition-colors rounded-md px-4 py-2"
              >
                Manage Billing
            </Button>
          ) : (
            <PlanSelectorSheet>
                <Button 
                    className="bg-blue-600 text-white hover:bg-blue-700 transition-colors rounded-md px-4 py-2"
                >
                    Upgrade
                </Button>
            </PlanSelectorSheet>
          )}
        </div>
        
        {isFreePlan && (
          <div className="grid gap-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Student Usage</h3>
            <div className="flex items-center gap-4">
              <Progress value={usagePercentage} className="h-2 w-full bg-gray-200 rounded-full" />
              <span className="text-sm font-medium text-gray-800 dark:text-white">{Math.round(usagePercentage)}%</span>
            </div>
            <p className="text-sm text-gray-600">
              You have used {studentCount} of your {FREE_PLAN_STUDENT_LIMIT} student limit. 
              {isNearingStudentLimit && !isStudentLimitReached && (
                <span className="text-yellow-600"> You are nearing your student limit.</span>
              )}
              {isStudentLimitReached && (
                <span className="text-red-600"> You have reached your student limit.</span>
              )}
              {!isStudentLimitReached && ' Upgrade to Pro for unlimited students.'}
            </p>
          </div>
        )}

        {isSubscribed && userDetails?.subscription_end_date && (
            <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 text-white">Subscription End Date</h3> {/* Changed title */}
                <p className="text-sm text-gray-600 mt-1">
                    Your current subscription is active until {new Date(userDetails.subscription_end_date).toLocaleDateString()}. Please renew manually to continue uninterrupted service.
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
