import Branding from "@/components/auth/Branding";
import LoginForm from "@/components/auth/LoginForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Libly Space",
  description: "Library management for modern libraries"
}


export default function LoginPage() {
  return (
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <LoginForm />
      <Branding />
    </div>
  )
}
