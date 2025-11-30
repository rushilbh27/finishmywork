'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { EnvelopeIcon, UserGroupIcon, MagnifyingGlassIcon, CheckCircleIcon, ClockIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export type WaitlistEntry = {
  id: string
  email: string
  name?: string
  city?: string
  college?: string
  status: string
  joinedAt: string
}

export default function WaitlistAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sendingInvite, setSendingInvite] = useState<string | null>(null)

  useEffect(() => {
    fetchWaitlist()
  }, [])

  async function fetchWaitlist() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/waitlist')
      const data = await res.json()
      setWaitlist(data || [])
    } catch (e) {
      toast({ title: '❌ Error', description: 'Failed to load waitlist', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  async function invite(email: string) {
    setSendingInvite(email)
    try {
      const res = await fetch(`/api/admin/waitlist/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send invite')
      }
      
      toast({ 
        title: '✅ Invite Sent!', 
        description: `Signup link sent to ${email}`,
      })
      fetchWaitlist() // Refresh to show updated status
    } catch (e: any) {
      toast({ 
        title: '❌ Error', 
        description: e.message || 'Failed to send invite', 
        variant: 'destructive' 
      })
    } finally {
      setSendingInvite(null)
    }
  }

  const filteredWaitlist = waitlist.filter(
    (entry) =>
      entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const stats = {
    total: waitlist.length,
    pending: waitlist.filter((e) => e.status === 'pending').length,
    invited: waitlist.filter((e) => e.status === 'invited').length,
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 p-6">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/dashboard')}
            className="inline-flex items-center gap-2 mb-4 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
              <UserGroupIcon className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Waitlist Management
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">Manage and invite early access users</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                <UserGroupIcon className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Signups</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {stats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl border border-yellow-500/30">
                <ClockIcon className="w-7 h-7 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Pending</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                  {stats.pending}
                </p>
              </div>
            </div>
          </div>

          <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                <CheckCircleIcon className="w-7 h-7 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Invited</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  {stats.invited}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email, name, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-card/60 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 backdrop-blur-2xl transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading waitlist...</p>
            </div>
          </div>
        ) : (
          <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/60">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">City</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">College</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredWaitlist.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full border border-purple-500/20">
                            <UserGroupIcon className="w-8 h-8 text-purple-400/50" />
                          </div>
                          <p className="text-sm text-muted-foreground">No waitlist entries found</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredWaitlist.map((entry) => (
                      <tr key={entry.id} className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">{entry.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">{entry.name || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">{entry.city || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">{entry.college || '—'}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                              entry.status === 'invited'
                                ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                                : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}
                          >
                            {entry.status === 'invited' ? (
                              <>
                                <CheckCircleIcon className="w-3.5 h-3.5" />
                                Invited
                              </>
                            ) : (
                              <>
                                <ClockIcon className="w-3.5 h-3.5" />
                                Pending
                              </>
                            )}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-muted-foreground">
                            {new Date(entry.joinedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => invite(entry.email)}
                            disabled={entry.status === 'invited' || sendingInvite === entry.email}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              entry.status === 'invited'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-300 border border-purple-500/30 hover:scale-105'
                            }`}
                          >
                            {sendingInvite === entry.email ? (
                              <>
                                <div className="w-4 h-4 border-2 border-purple-300/30 border-t-purple-300 rounded-full animate-spin" />
                                Sending...
                              </>
                            ) : entry.status === 'invited' ? (
                              <>
                                <CheckCircleIcon className="w-4 h-4" />
                                Invited
                              </>
                            ) : (
                              <>
                                <EnvelopeIcon className="w-4 h-4" />
                                Send Invite
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
