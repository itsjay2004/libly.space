'use client'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { CustomLink } from '@/components/ui/custom-link'
import NProgress from 'nprogress';
import Logo from '../logo'
import { motion } from 'framer-motion'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (!authError) {
        NProgress.start();
        router.push('/dashboard')
      } else {
        setError(authError.message)
      }
    } catch (err) {
      setError('An unexpected error occurred.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4">
      {/* Animated Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/40 dark:border-slate-700/50 
        bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-2xl p-8"
      >
        {/* Header Section */}
        <div className="grid gap-2 text-center mb-6">
          <Logo />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent 
            dark:from-indigo-400 dark:to-purple-400">
            Welcome Back!
          </h1>
          <p className="text-muted-foreground dark:text-slate-300">
            Enter your email below to login to your account
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSignIn} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="name@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center">
              <Label htmlFor="password">Password</Label>
              <CustomLink
                href="/forgot-password"
                className="ml-auto inline-block text-sm underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
              >
                Forgot your password?
              </CustomLink>
            </div>
            <Input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="focus-visible:ring-2 focus-visible:ring-indigo-500/60 transition-all"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 
              text-white shadow-lg transition-all"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-4 text-center text-sm dark:text-slate-300">
          Don&apos;t have an account?{' '}
          <CustomLink
            href="/signup"
            className="underline text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            Sign up
          </CustomLink>
        </div>
      </motion.div>
    </div>
  )
}
