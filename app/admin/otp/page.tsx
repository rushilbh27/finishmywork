"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

export default function AdminOTPPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [code, setCode] = useState<string>('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Auto focus handled by input autoFocus
  }, [])

  const requestOtp = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/otp/request', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to send OTP')
      toast({ title: 'OTP sent', description: 'Check your admin email for the code.' })
    } catch (e: any) {
      toast({ title: 'Unable to send OTP', description: e?.message || 'Try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Send OTP on page load
    requestOtp()
  }, [])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) {
      toast({ title: 'Invalid code', description: 'Enter the 6-digit code.', variant: 'destructive' })
      return
    }
    try {
      setLoading(true)
      const res = await fetch('/api/admin/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: code }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || 'Invalid OTP')
      toast({ title: 'Verified', description: 'Admin access granted.' })
      router.replace('/admin/dashboard')
    } catch (e: any) {
      toast({ title: 'Incorrect code', description: e?.message || 'Please try again.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 pt-12 sm:pt-16">
      <div className="backdrop-blur-2xl bg-card/85 border border-border/60 rounded-2xl shadow-card px-8 py-10 max-w-md w-full">
        <h1 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2 text-center">Admin verification</h1>
        <p className="text-muted-foreground text-center mb-6">Enter the 6-digit code sent to your admin email.</p>
        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <input
                key={i}
                type="text"
                inputMode="numeric"
                maxLength={1}
                autoFocus={i === 0}
                className="h-12 w-full text-center text-lg rounded-xl bg-surface/60 border border-border/60 text-foreground focus-visible:ring-[3px] focus-visible:ring-[var(--accent-from)] outline-none"
                value={code[i] || ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  const next = (code.slice(0, i) + v + code.slice(i + 1)).slice(0, 6)
                  setCode(next)
                  if (v && i < 5) {
                    const nextInput = (e.target.parentElement?.children[i + 1] as HTMLInputElement | undefined)
                    nextInput?.focus()
                  }
                }}
              />
            ))}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 font-medium border border-purple-500/30 transition-all"
          >
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={requestOtp}
            className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground font-medium border border-border/60 transition-all"
          >
            Resend code
          </button>
        </form>
      </div>
    </div>
  )
}
