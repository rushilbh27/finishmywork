"use client"

import * as React from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { PREDEFINED_LOCATIONS } from '@/lib/constants'

const signUpSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  university: z.string().trim().min(2, 'University is required'),
  major: z.string().trim().min(2, 'Major is required'),
  year: z.string().min(1, 'Please select your academic year'),
  location: z.string().min(1, 'Please select your location'),
  customLocation: z.string().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
}).refine((data) => {
  if (data.location === 'OTHER' && !data.customLocation?.trim()) {
    return false
  }
  return true
}, {
  message: 'Please specify your location',
  path: ['customLocation'],
})

type SignUpForm = z.infer<typeof signUpSchema>

export default function SignUpForm() {
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      university: '',
      major: '',
      year: '',
      location: '',
      customLocation: '',
      password: '',
    },
  })

  const selectedLocation = watch('location')

  const [showPassword, setShowPassword] = React.useState(false)
  const [verifySent, setVerifySent] = React.useState(false)
  const [registeredEmail, setRegisteredEmail] = React.useState('')
  const maskedRegistered = React.useMemo(() => {
    const email = registeredEmail
    if (!email) return ''
    const [u, d] = email.split('@')
    if (!u || !d) return email
    const hidden = u.length <= 2 ? u[0] + '*' : u[0] + '*'.repeat(Math.max(1, u.length - 2)) + u[u.length - 1]
    return hidden + '@' + d
  }, [registeredEmail])
  const [resending, setResending] = React.useState(false)

  const onSubmit = async (data: SignUpForm) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name.trim(),
          email: data.email,
          password: data.password,
          university: data.university.trim(),
          major: data.major.trim(),
          year: data.year,
          location: data.location === 'OTHER' ? data.customLocation?.trim() : data.location,
        }),
      })

      if (response.ok) {
        const body = await response.json().catch(() => ({}))
        setRegisteredEmail(data.email)
        setVerifySent(true)
        toast({
          title: 'Verification link sent',
          description: 'Check your inbox to verify your account.',
        })
      } else {
        const body = await response.json().catch(() => ({}))
        toast({
          title: 'Unable to create account',
          description: body.message || 'Something went wrong. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Unable to create account. Please try again.',
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
          {verifySent ? (
            <div className="text-center">
              <div className="mb-6 space-y-2">
                <h2 className="text-2xl font-semibold text-foreground">
                  Verify your email
                </h2>
                <p className="text-sm text-muted-foreground">
                  We emailed a verification link to
                </p>
                <p className="text-foreground font-medium">{maskedRegistered}</p>
              </div>

              <div className="space-y-3">
                <Button
                  asChild
                  variant="gradient"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  <Link href="/auth/signin">Go to sign in</Link>
                </Button>

                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl"
                >
                  <a
                    href="https://mail.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open Gmail
                  </a>
                </Button>
              </div>

              <div className="mt-6 flex items-center justify-center gap-3">
                <p className="text-sm text-muted-foreground">Already verified?</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-purple-400 hover:text-purple-300"
                  disabled={resending}
                  onClick={async () => {
                    if (!registeredEmail) return
                    try {
                      setResending(true)
                      await fetch('/api/auth/email/verify/request', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: registeredEmail }),
                      })
                      toast({ title: 'Email resent!', description: 'Check your inbox for the verification link.' })
                    } finally {
                      setResending(false)
                    }
                  }}
                >
                  {resending ? 'Resending…' : 'Resend email'}
                </Button>
              </div>
            </div>
          ) : (
          <>
          <div className="mb-6 space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">
              Create your account
            </h2>
            <p className="text-sm text-muted-foreground">
              Join FinishMyWork — find and post student tasks nearby.
            </p>
            <p className="text-sm text-muted-foreground">
              <Link
                href="/auth/signin"
                className="font-medium text-[color:var(--accent-from)] hover:text-[color:var(--accent-to)] transition"
              >
                Already have an account?
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-5 max-h-[60vh] overflow-y-auto pb-20">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Full Name" error={errors.name?.message}>
                  <Input
                    {...register('name')}
                    placeholder="Your full name"
                    className="h-11 rounded-xl bg-surface/60"
                  />
                </Field>

                <Field label="Email Address" error={errors.email?.message}>
                  <Input
                    {...register('email')}
                    type="email"
                    placeholder="you@example.com"
                    className="h-11 rounded-xl bg-surface/60"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="University" error={errors.university?.message}>
                  <Input
                    {...register('university')}
                    placeholder="Your university"
                    className="h-11 rounded-xl bg-surface/60"
                  />
                </Field>

                <Field label="Major" error={errors.major?.message}>
                  <Input
                    {...register('major')}
                    placeholder="Your major"
                    className="h-11 rounded-xl bg-surface/60"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Academic Year" error={errors.year?.message}>
                  <select
                    {...register('year')}
                    className={cn(
                      'h-11 w-full rounded-xl border border-border/60 bg-surface/60 px-3 text-sm text-foreground',
                      'focus-visible:ring-[3px] focus-visible:ring-[var(--accent-from)] outline-none transition',
                    )}
                  >
                    <option value="" className="bg-background text-foreground">Select year</option>
                    <option value="10th Grade" className="bg-background text-foreground">10th Grade (High School)</option>
                    <option value="11th Grade" className="bg-background text-foreground">11th Grade (Higher Secondary)</option>
                    <option value="12th Grade" className="bg-background text-foreground">12th Grade (Higher Secondary)</option>
                    <option value="1st Year" className="bg-background text-foreground">1st Year (Undergraduate)</option>
                    <option value="2nd Year" className="bg-background text-foreground">2nd Year (Undergraduate)</option>
                    <option value="3rd Year" className="bg-background text-foreground">3rd Year (Undergraduate)</option>
                    <option value="4th Year" className="bg-background text-foreground">4th Year (Undergraduate)</option>
                    <option value="Postgraduate" className="bg-background text-foreground">Postgraduate (Masters/PhD)</option>
                  </select>
                </Field>

                <Field label="Location" error={errors.location?.message}>
                  <select
                    {...register('location')}
                    className={cn(
                      'h-11 w-full rounded-xl border border-border/60 bg-surface/60 px-3 text-sm text-foreground',
                      'focus-visible:ring-[3px] focus-visible:ring-[var(--accent-from)] outline-none transition',
                    )}
                  >
                    <option value="" className="bg-background text-foreground">Select your location</option>
                    {PREDEFINED_LOCATIONS.map((loc) => (
                      <option key={loc.value} value={loc.value} className="bg-background text-foreground">
                        {loc.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              {selectedLocation === 'OTHER' && (
                <Field label="Specify your location" error={errors.customLocation?.message}>
                  <Input
                    {...register('customLocation')}
                    placeholder="City, campus or area"
                    className="h-11 rounded-xl bg-surface/60"
                  />
                </Field>
              )}

              <div className="grid grid-cols-1 gap-4">
                <Field label="Password" error={errors.password?.message}>
                  <div className="relative">
                    <Input
                      {...register('password')}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a password"
                      className="h-11 rounded-xl bg-surface/60 pr-12"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground px-2 py-1 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-from)]"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                    </button>
                  </div>
                </Field>
              </div>
            </div>

            <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t border-border/30 bg-card/85 py-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="gradient"
                className="rounded-xl px-6"
              >
                {isSubmitting ? 'Creating…' : 'Create account'}
              </Button>
            </div>
          </form>
          </>
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
