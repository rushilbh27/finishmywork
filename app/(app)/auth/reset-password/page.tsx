'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const resetPasswordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPassword() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [success, setSuccess] = React.useState(false)
  
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onChange',
  })

  React.useEffect(() => {
    if (!token || !email) {
      toast({
        title: 'Invalid reset link',
        description: 'This password reset link is invalid or expired.',
        variant: 'destructive',
      })
      router.push('/auth/forgot-password')
    }
  }, [token, email, router, toast])

  const onSubmit = async (data: ResetPasswordForm) => {
    if (!token || !email) return

    try {
      const response = await fetch('/api/auth/password/reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          token,
          newPassword: data.newPassword,
        }),
      })

      if (response.ok) {
        setSuccess(true)
        toast({
          title: 'Password reset successfully!',
          description: 'You can now sign in with your new password.',
        })
      } else {
        const body = await response.json().catch(() => ({}))
        toast({
          title: 'Unable to reset password',
          description: body.message || 'The reset link may be invalid or expired.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Unable to reset password. Please try again.',
        variant: 'destructive',
      })
    }
  }

  if (!token || !email) {
    return null
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="w-full max-w-md"
      >
        <div className="rounded-xl border border-border/60 bg-card/95 p-8 shadow-[0_30px_90px_rgba(15,23,42,0.45)] backdrop-blur-2xl">
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              {success ? 'Password reset complete' : 'Create new password'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {success
                ? 'Your password has been successfully reset.'
                : 'Enter your new password below.'}
            </p>
          </div>

          {success ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                You can now sign in to your account with your new password.
              </div>
              <Button
                variant="gradient"
                className="w-full rounded-xl"
                onClick={() => router.push('/auth/signin')}
              >
                Go to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="New password" error={errors.newPassword?.message}>
                <Input
                  {...register('newPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Create a new password"
                  className="rounded-xl bg-surface/90 border-border/60"
                />
              </Field>

              <Field label="Confirm new password" error={errors.confirmPassword?.message}>
                <Input
                  {...register('confirmPassword')}
                  type="password"
                  autoComplete="new-password"
                  placeholder="Confirm your new password"
                  className="rounded-xl bg-surface/90 border-border/60"
                />
              </Field>

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  variant="gradient"
                  className="w-full rounded-xl px-6"
                >
                  {isSubmitting ? 'Resetting...' : 'Reset password'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => router.push('/auth/signin')}
                >
                  Back to sign in
                </Button>
              </div>
            </form>
          )}
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
