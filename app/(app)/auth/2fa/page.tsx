'use client'

import * as React from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/use-toast'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function TwoFactorAuth() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  const [code, setCode] = React.useState('')
  const [isVerifying, setIsVerifying] = React.useState(false)

  // Redirect if not authenticated or 2FA not enabled
  React.useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (code.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter a 6-digit code.',
        variant: 'destructive',
      })
      return
    }

    setIsVerifying(true)

    try {
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })

      if (response.ok) {
        toast({
          title: 'Verified!',
          description: 'Two-factor authentication successful.',
        })
        
        const redirect = searchParams.get('redirect') || '/dashboard'
        router.push(redirect)
      } else {
        const data = await response.json()
        toast({
          title: 'Verification failed',
          description: data.message || 'Invalid code. Please try again.',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Unable to verify code. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsVerifying(false)
    }
  }

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
    <div className="pt-12 sm:pt-16 max-w-md mx-auto px-4 pb-32">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
        transition={{ type: 'spring', stiffness: 240, damping: 22 }}
        className="w-full"
      >
        <div className="rounded-2xl border border-border/60 bg-card/85 p-6 sm:p-8 shadow-card backdrop-blur-2xl">
          <div className="mb-6 space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Two-Factor Authentication
            </h2>
            <p className="text-sm text-muted-foreground">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Authentication Code</Label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                className="w-full text-center tracking-widest text-2xl px-4 py-3 rounded-xl bg-surface/60 text-foreground border border-border/60 outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--accent-from)] transition"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="sticky bottom-0 mt-4 flex items-center justify-end gap-3 border-t border-border/30 bg-card/85 py-4">
              <Button
                type="submit"
                disabled={isVerifying || code.length !== 6}
                variant="gradient"
                className="rounded-xl px-6"
              >
                {isVerifying ? 'Verifying…' : 'Verify'}
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
