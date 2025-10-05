"use client"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { FormEvent, useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [libraryName, setLibraryName] = useState('')
  const [otpDigits, setOtpDigits] = useState<string[]>(new Array(6).fill('')) // For individual OTP boxes
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()
  const otpInputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleSendOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          library_name: libraryName,
        }
      }
    })

    if (signUpError) {
      setError(signUpError.message)
      console.error(signUpError)
    } else {
      setOtpSent(true)
      setMessage('A verification code has been sent to your email. Please check your inbox and enter the code below.')
    }
  }

  const handleOtpChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const { value } = e.target;
    if (/[^0-9]/.test(value)) return; // Only allow numbers

    const newOtpDigits = [...otpDigits];
    newOtpDigits[index] = value;
    setOtpDigits(newOtpDigits);

    // Auto-focus to next input
    if (value && index < otpDigits.length - 1) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (!value && index > 0) {
      // Auto-focus to previous input on backspace if current is empty
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    const otp = otpDigits.join(''); // Combine digits into a single OTP string

    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email',
    })

    if (verifyError) {
      setError(verifyError.message)
      console.error(verifyError)
    } else {
      setMessage('Email verified successfully! Redirecting to dashboard...')
      router.push('/dashboard')
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">Sign Up</CardTitle>
          <CardDescription>
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!otpSent ? (
            <form onSubmit={handleSendOtp} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input id="full-name" placeholder="John Doe" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="library-name">Library name</Label>
                <Input id="library-name" placeholder="My Awesome Library" required value={libraryName} onChange={(e) => setLibraryName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="grid gap-4">
              <div className="grid gap-2">
                <p className="text-sm text-gray-700 dark:text-gray-300">{message}</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="otp">Verification Code</Label>
                <div className="flex justify-center space-x-2">
                  {otpDigits.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      maxLength={1}
                      className="w-12 text-center text-lg"
                      value={digit}
                      onChange={(e) => handleOtpChange(e, index)}
                      onKeyDown={(e) => handleKeyDown(e, index)}
                      ref={(el) => (otpInputRefs.current[index] = el)}
                      required
                    />
                  ))}
                </div>
              </div>
              <Button type="submit" className="w-full">
                Verify Email
              </Button>
            </form>
          )}
          {error && <p className="mt-4 text-center text-sm text-destructive">{error}</p>}
          <div className="mt-4 text-center text-sm">
            Already have an account?{" "}
            <Link href="/login" className="underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
