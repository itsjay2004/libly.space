import Branding from "@/components/auth/Branding";
import LoginForm from "@/components/auth/LoginForm";
import Footer from "@/components/footer"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Libly Space",
  description: "Library management for modern libraries"
}


export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow w-full lg:grid lg:grid-cols-2">
        <LoginForm />
        <Branding />
      </div>
      <Footer />
    </div>
  )
}
