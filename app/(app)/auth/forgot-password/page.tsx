'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export default function ForgotPassword() {
  const router = useRouter()
  const { toast } = useToast()
  const [emailSent, setEmailSent] = React.useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onChange',
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    try {
      const response = await fetch('/api/auth/password/reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      })

      if (response.ok) {
        setEmailSent(true)
        toast({
          title: 'Email sent!',
          description: 'Check your inbox for password reset instructions.',
        })
      } else {
        const body = await response.json().catch(() => ({}))
        if (response.status === 429) {
          toast({
            title: 'Too many requests',
            description: 'Please wait a few minutes before trying again.',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Unable to send email',
            description: body.message || 'Something went wrong. Please try again.',
            variant: 'destructive',
          })
        }
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Unable to send reset email. Please try again.',
        variant: 'destructive',
      })
    }
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
              Reset your password
            </h2>
            <p className="text-sm text-muted-foreground">
              {emailSent
                ? "We've sent you an email with instructions to reset your password."
                : "Enter your email and we'll send you a link to reset your password."}
            </p>
          </div>

          {emailSent ? (
            <div className="space-y-5">
              <div className="rounded-xl bg-surface/60 p-4 text-sm text-muted-foreground">
                Check your inbox and click the link to reset your password. 
                The link will expire in 30 minutes.
              </div>
              <div className="flex flex-col gap-3">
                <Button
                  variant="gradient"
                  className="w-full rounded-xl"
                  onClick={() => router.push('/auth/signin')}
                >
                  Back to sign in
                </Button>
                <Button
                  variant="outline"
                  className="w-full rounded-xl"
                  onClick={() => setEmailSent(false)}
                >
                  Send another email
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Field label="Email address" error={errors.email?.message}>
                <Input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
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
                  {isSubmitting ? 'Sending...' : 'Send reset link'}
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
