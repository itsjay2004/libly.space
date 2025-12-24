import Branding from "@/components/auth/Branding";
import SignupForm from "@/components/auth/SignupForm";
import Footer from "@/components/footer"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Signup - Libly Space',
  description: 'Library management for modern libraries',
};


export default function SignupPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow w-full lg:grid lg:grid-cols-2">
        <SignupForm />
        <Branding />
      </div>
      <Footer />
    </div>
  )
}
