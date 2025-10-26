import Branding from "@/components/auth/Branding";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <LoginForm />
      <Branding />
    </div>
  )
}
