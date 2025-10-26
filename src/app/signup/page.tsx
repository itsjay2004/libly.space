import Branding from "@/components/auth/Branding";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <SignupForm />
      <Branding />
    </div>
  )
}
