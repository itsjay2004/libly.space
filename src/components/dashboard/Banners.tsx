
"use client";

import Banner from "@/components/banner";
import { useUser } from "@/hooks/use-user";
import { useRouter } from "next/navigation";

export function Banners() {
    const { 
        studentCount, 
        isStudentLimitReached, 
        isNearingStudentLimit, 
        isSubscriptionExpired, 
        isSubscriptionExpiringSoon, 
      } = useUser();
      const router = useRouter();

      const handleUpgrade = () => {
        router.push('/dashboard/cart');
      };

    return (
        <div className="flex flex-col gap-4 mb-4">
            {isSubscriptionExpired && (
              <Banner 
                type="error" 
                message="Your subscription has expired. Please renew to continue using the service."
                buttonText="Renew Subscription"
                onButtonClick={handleUpgrade}
              />
            )}
            {isStudentLimitReached && (
              <Banner 
                type="error" 
                message="You have reached your student limit. Please upgrade to Pro to add more students."
                buttonText="Upgrade to Pro"
                onButtonClick={handleUpgrade}
              />
            )}
            {isSubscriptionExpiringSoon && (
              <Banner 
                type="warning" 
                message="Your subscription is expiring soon. Please renew to avoid service interruption."
                buttonText="Renew Now"
                onButtonClick={handleUpgrade}
              />
            )}
            {isNearingStudentLimit && (
              <Banner 
                type="warning" 
                message={`You are nearing your student limit. You have ${50 - studentCount} spots left.`}
                buttonText="Upgrade to Pro"
                onButtonClick={handleUpgrade}
              />
            )}
        </div>
    )
}
