import SubscriptionDetails from "@/components/account/subscription-details";
import ProfileDetails from "@/components/account/profile-details";
import SecuritySettings from "@/components/account/security-settings";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Account - Libly Space',
  description: 'Library management for modern libraries',
};

export default function AccountPage() {
  return (
    <div className="px-1 sm:px-4 lg:px-6">
      <div className="max-w-4xl grid grid-cols-1 gap-8">
        <ProfileDetails />
        <SubscriptionDetails />
        <SecuritySettings />
      </div>
    </div>
  );
}
