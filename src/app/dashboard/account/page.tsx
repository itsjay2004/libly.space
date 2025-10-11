import SubscriptionDetails from "@/components/account/subscription-details";
import ProfileDetails from "@/components/account/profile-details";
import SecuritySettings from "@/components/account/security-settings";

export default function AccountPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl grid grid-cols-1 gap-8">
        <ProfileDetails />
        <SubscriptionDetails />
        <SecuritySettings />
      </div>
    </div>
  );
}
