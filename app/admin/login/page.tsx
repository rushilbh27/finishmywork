'use client'

import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { LockClosedIcon, UserIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

export default function AdminLoginPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('admin@finishmywork.com')// Pre-fill for convenience
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    console.log('Admin login page - Session:', session?.user)
    console.log('Status:', status)
    
    // Only redirect if already logged in as admin
    if (status === 'authenticated' && session?.user?.role === 'ADMIN') {
      console.log('Already admin, redirecting to dashboard')
      router.push('/admin/dashboard')
    }
  }, [session, router, status, mounted])

  if (!mounted) {
    return null // Prevent hydration mismatch
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Please fill in all fields', variant: 'destructive' })
      return
    }

    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        toast({ title: 'Invalid admin credentials', variant: 'destructive' })
      } else if (result?.ok) {
        toast({ title: 'Login successful! Redirecting...', variant: 'success' })
        router.push('/admin/dashboard')
      }
    } catch (error) {
      toast({ title: 'Login failed', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-20 w-20 bg-red-600/20 backdrop-blur-xl rounded-full flex items-center justify-center border border-red-500/30">
            <LockClosedIcon className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-bold text-white">
            Admin Panel Login
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Access restricted to authorized administrators only
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  placeholder="Enter admin email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  placeholder="Enter admin password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 backdrop-blur-xl"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Access Admin Panel'
              )}
            </button>
          </div>

          {session?.user && session.user.role !== 'ADMIN' && (
            <div className="text-center mb-4">
              <p className="text-sm text-yellow-300 mb-2">
                Currently logged in as: {session.user.name} ({session.user.role})
              </p>
              <button
                onClick={() => {
                  signOut({ redirect: false }).then(() => {
                    window.location.reload()
                  })
                }}
                className="text-sm text-red-300 hover:text-red-100 underline"
              >
                Logout to access admin panel
              </button>
            </div>
          )}

          <div className="text-center">
            <a
              href="/"
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              ← Back to FinishMyWork
            </a>
          </div>
        </form>
      </div>
    </div>
  )
}