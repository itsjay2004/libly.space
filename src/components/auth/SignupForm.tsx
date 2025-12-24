'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { CustomLink } from '@/components/ui/custom-link'
import NProgress from 'nprogress';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import Logo from '../logo'
import { motion } from 'framer-motion'

export default function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone: phone,
          },
        },
      })

      if (authError) {
        setError(authError.message)
      } else {
        setIsSubmitted(true)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const { error: verificationError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (verificationError) {
        setError(verificationError.message)
      } else {
        NProgress.start();
        router.push('/onboarding')
      }
    } catch (err) {
      setError('An unexpected error occurred during OTP verification.');
      console.error(err);
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 dark:border-slate-700/50 
          bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8 text-center"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent 
            dark:from-indigo-400 dark:to-purple-400 mb-3">
            Enter Verification Code
          </h1>
          <p className="text-muted-foreground dark:text-slate-300 mb-6">
            A 6-digit code has been sent to <strong>{email}</strong>. Please enter it below to continue.
          </p>
          <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {error && <p className="text-sm font-medium text-destructive mt-2">{error}</p>}
          <Button
            type="submit"
            className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
              text-white transition-all"
            disabled={isLoading}
            onClick={handleVerifyOtp}
          >
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 dark:border-slate-700/50 
        bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8"
      >
        <div className="grid gap-2 text-center mb-6">
          <Logo />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent 
            dark:from-indigo-400 dark:to-purple-400">
            Create Your Account
          </h1>
          <p className="text-muted-foreground dark:text-slate-300">
            Enter your information to create an account
          </p>
        </div>
        <form onSubmit={handleSignUp} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="full-name">Full name</Label>
            <Input
              id="full-name"
              placeholder="Aarav Sharma"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-2 h-2/3 border-slate-200 dark:border-slate-700">
                <span className="text-lg">🇮🇳</span>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">+91</span>
              </div>
              <Input
                id="phone"
                placeholder="98765 43210"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isLoading}
                className="pl-20 focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="aarav@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
            />
          </div>
          {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
              text-white shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Creating account...' : 'Create an account'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm dark:text-slate-300">
          Already have an account?{' '}
          <CustomLink href="/login" className="underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700">
            Sign in
          </CustomLink>
        </div>
      </motion.div>
    </div>
  )
}
