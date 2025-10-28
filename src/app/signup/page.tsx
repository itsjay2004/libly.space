import Branding from "@/components/auth/Branding";
import SignupForm from "@/components/auth/SignupForm";
import Footer from "@/components/footer"
import { Metadata } from "next";

export const metadata: Metadata = {
  title: 'Dashboard - Libly Space',
  description: 'Library management for modern libraries',
};


export default function SignupPage() {
  return (
    <>
    <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
      <SignupForm />
      <Branding />
    </div>
    <div>
    <Footer />
    </div>
    </>
  )
}
