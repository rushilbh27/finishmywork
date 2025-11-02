"use client"
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function VerifyPending() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { status } = useSession()
  const router = useRouter()
  const [resent, setResent] = useState(false)
  const [loading, setLoading] = useState(false)
  const email = searchParams?.get('email') || ''
  const masked = useMemo(() => {
    if (!email) return ''
    const [u, d] = email.split('@')
    if (!u || !d) return email
    const hidden = u.length <= 2 ? u[0] + '*' : u[0] + '*'.repeat(Math.max(1, u.length - 2)) + u[u.length - 1]
    return hidden + '@' + d
  }, [email])

  useEffect(() => {
    const err = searchParams?.get('error')
    if (err === 'expired') {
      toast({
        title: 'Verification link expired',
        description: 'We can send you a new link. Click Resend.',
      })
    }
  }, [searchParams, toast])

  // If the user is authenticated, they are verified (signIn callback enforces it) — skip this page
  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  const handleResend = async () => {
    if (!email) return
    try {
      setLoading(true)
      await fetch('/api/auth/email/verify/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResent(true)
    } catch {}
    finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen pt-12 sm:pt-16 px-4 pb-32 bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      <div className="max-w-md mx-auto rounded-2xl border border-border/60 bg-card/85 backdrop-blur-2xl shadow-card p-6 sm:p-8 text-center">
        <h2 className="text-2xl font-semibold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent mb-2">Verify your email</h2>
        <p className="text-muted-foreground mb-1">We emailed a verification link to</p>
        {email && (<p className="text-foreground font-medium mb-6">{masked}</p>)}
        <button
          className="w-full py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 font-medium border border-purple-500/30 transition-all mb-3"
          onClick={handleResend}
          disabled={loading}
        >
          {loading ? 'Resending...' : resent ? 'Email resent!' : 'Resend email'}
        </button>
        <a
          href="https://mail.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground font-medium border border-border/60 transition-all"
        >
          Open Gmail
        </a>
        <div className="mt-6 flex items-center justify-center gap-3">
          <a href="/dashboard" className="inline-block px-5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 font-medium border border-purple-500/30 transition-all">Go to Dashboard</a>
          <a href="/auth/signin" className="inline-block px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 font-medium border border-white/10 transition-all">Sign In</a>
        </div>
      </div>
    </div>
  )
}
