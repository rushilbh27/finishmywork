'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type SignInForm = z.infer<typeof signInSchema>

export default function SignIn() {
  const router = useRouter()
  const { toast } = useToast()
  const { data: session, status } = useSession()
  
  // Redirect if already logged in
  React.useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: SignInForm) => {
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error?.includes('EMAIL_NOT_VERIFIED')) {
          toast({
            title: 'Verify your email',
            description: 'Check your inbox for the verification link.',
          })
          router.push(`/auth/verify-pending?email=${encodeURIComponent(data.email)}`)
          return
        }
        toast({
          title: 'Sign in failed',
          description: 'Invalid email or password. Please try again.',
          variant: 'destructive',
        })
      } else {
        // Check if user has 2FA enabled
        const response = await fetch('/api/user/2fa-status')
        const { twoFactorEnabled } = await response.json()

        if (twoFactorEnabled) {
          // Redirect to 2FA verification
          router.push('/auth/2fa?redirect=/dashboard')
        } else {
          // Proceed to dashboard
          toast({
            title: 'Welcome back!',
            description: 'Signed in successfully.',
          })
          router.push('/dashboard')
        }
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Unable to sign in. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Show loading state while checking auth
  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pt-12 sm:pt-16 max-w-2xl mx-auto px-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="w-full"
      >
        <div className="rounded-2xl border border-border/60 bg-card/85 p-6 sm:p-8 shadow-card backdrop-blur-2xl">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Sign in to your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Or{' '}
              <Link
                href="/auth/signup"
                className="font-medium text-[color:var(--accent-from)] hover:text-[color:var(--accent-to)] transition"
              >
                create a new account
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-5">
              <Field label="Email address" error={errors.email?.message}>
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="h-11 rounded-xl bg-surface/60"
                />
              </Field>

              <Field label="Password" error={errors.password?.message}>
                <Input
                  {...register('password')}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="h-11 rounded-xl bg-surface/60"
                />
              </Field>
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-[color:var(--accent-from)] hover:text-[color:var(--accent-to)] transition"
              >
                Forgot password?
              </Link>
            </div>

            <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t border-border/30 bg-card/85 py-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="gradient"
                className="rounded-xl px-6"
              >
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
