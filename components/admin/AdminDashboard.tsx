"use client"

import { useEffect, useMemo, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  UserGroupIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  BanknotesIcon,
  ChartBarSquareIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  ArrowRightOnRectangleIcon,
  EyeIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  LockClosedIcon,
  FlagIcon,
  NoSymbolIcon,
} from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/use-toast'
import ConfirmDialog from '../ui/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '../ui/dialog'

interface AdminStats {
  totalUsers: number
  totalTasks: number
  totalRevenue: number
  activeUsers: number
  completedTasks: number
  pendingTasks: number
}

interface User {
  id: number
  name: string
  email: string
  role: string
  university?: string
  createdAt: string
  isSuspended?: boolean
  _count?: { postedTasks: number; acceptedTasks: number }
}

interface Task {
  id: number
  title: string
  status: string
  budget: number
  createdAt: string
  poster: { name: string; email: string }
  accepter?: { name: string; email: string }
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const searchParams = useSearchParams()

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTasks: 0,
    totalRevenue: 0,
    activeUsers: 0,
    completedTasks: 0,
    pendingTasks: 0,
  })
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })
  const [userModalOpen, setUserModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any | null>(null)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [userLoading, setUserLoading] = useState(false)
  const [taskLoading, setTaskLoading] = useState(false)
  const [suspendDialog, setSuspendDialog] = useState({
    isOpen: false,
    userId: 0,
    userName: '',
    reason: '',
    sendEmail: true,
  })

  // URL-synced tab from pathname
  const activeTab = useMemo<'overview' | 'users' | 'tasks'>(() => {
    if (pathname?.includes('/admin/users')) return 'users'
    if (pathname?.includes('/admin/tasks')) return 'tasks'
    return 'overview'
  }, [pathname])

  const openUserModal = async (userId: number) => {
    try {
      setUserLoading(true)
      setUserModalOpen(true)
      setSelectedUser(null)
      const res = await fetch(`/api/admin/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      const data = await res.json()
      setSelectedUser(data)
    } catch (e) {
      toast({ title: 'Unable to load user', variant: 'destructive' })
      setUserModalOpen(false)
    } finally {
      setUserLoading(false)
    }
  }

  const openTaskModal = async (taskId: number) => {
    try {
      setTaskLoading(true)
      setTaskModalOpen(true)
      setSelectedTask(null)
      const res = await fetch(`/api/tasks/${taskId}`)
      if (!res.ok) throw new Error('Failed to fetch task')
      const data = await res.json()
      setSelectedTask(data)
    } catch (e) {
      toast({ title: 'Unable to load task', variant: 'destructive' })
      setTaskModalOpen(false)
    } finally {
      setTaskLoading(false)
    }
  }

  useEffect(() => {
    // Check auth status first
    if (status === 'loading') return
    
    if (!session || session.user?.role !== 'ADMIN') {
      router.push('/admin/login')
      return
    }
    
    // Only fetch once when component mounts with admin session
    fetchAdminData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session])

  // Deep-link: open modals from query params
  useEffect(() => {
    const viewUser = searchParams?.get('viewUser')
    const viewTask = searchParams?.get('viewTask')
    if (viewUser) {
      const id = parseInt(viewUser)
      if (!Number.isNaN(id)) openUserModal(id)
    }
    if (viewTask) {
      const id = parseInt(viewTask)
      if (!Number.isNaN(id)) openTaskModal(id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch in parallel for speed
      const [statsRes, usersRes, tasksRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/users'),
        fetch('/api/admin/tasks'),
      ])
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
      
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }
      
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        setTasks(tasksData)
      }
    } catch (e) {
      toast({ title: 'Failed to load admin data', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    await signOut({ callbackUrl: origin ? `${origin}/admin/login` : '/admin/login' })
  }

  const deleteUser = (userId: number, userName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete "${userName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
          if (res.ok) {
              toast({ title: 'User deleted successfully', variant: 'success' })
            fetchAdminData()
          } else {
            const body = await res.json().catch(() => ({}))
              toast({ title: body.error || 'Failed to delete user', variant: 'destructive' })
          }
        } catch (e) {
            toast({ title: 'Error deleting user', variant: 'destructive' })
        }
        setConfirmDialog((p) => ({ ...p, isOpen: false }))
      },
    })
  }

  const suspendUser = (userId: number, userName: string) => {
    setSuspendDialog({
      isOpen: true,
      userId,
      userName,
      reason: '',
      sendEmail: true,
    })
  }

  const handleSuspendUser = async () => {
    try {
      const res = await fetch(`/api/admin/users/${suspendDialog.userId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: suspendDialog.reason,
          sendEmail: suspendDialog.sendEmail,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast({ title: 'User suspended successfully', variant: 'success' })
        if (data.emailSent) {
          toast({ title: 'Suspension email sent', variant: 'success' })
        }
        fetchAdminData()
      } else {
        const body = await res.json().catch(() => ({}))
        toast({ title: body.error || 'Failed to suspend user', variant: 'destructive' })
      }
    } catch (e) {
      toast({ title: 'Error suspending user', variant: 'destructive' })
    }
    setSuspendDialog({ isOpen: false, userId: 0, userName: '', reason: '', sendEmail: true })
  }

  const deleteTask = (taskId: number, taskTitle: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/tasks/${taskId}`, { method: 'DELETE' })
          if (res.ok) {
            toast({ title: 'Task deleted successfully', variant: 'success' })
            fetchAdminData()
          } else {
            toast({ title: 'Failed to delete task', variant: 'destructive' })
          }
        } catch (e) {
          toast({ title: 'Error deleting task', variant: 'destructive' })
        }
        setConfirmDialog((p) => ({ ...p, isOpen: false }))
      },
    })
  }

  const filteredUsers = users.filter(
    (u) => u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const filteredTasks = tasks.filter(
    (t) => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || t.poster.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
          <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const pushTab = (tab: 'overview' | 'users' | 'tasks') => {
    if (tab === 'overview') router.push('/admin/dashboard')
    if (tab === 'users') router.push('/admin/users')
    if (tab === 'tasks') router.push('/admin/tasks')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950">
      {/* Ambient glow */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 pt-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-xl shadow-card">
            <div className="flex justify-between items-center px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                  <LockClosedIcon className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">FinishMyWork Admin</h1>
                  <p className="text-xs text-muted-foreground">Platform Management Console</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{session?.user?.name}</p>
                  <p className="text-xs text-muted-foreground">Administrator</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-white/5 hover:bg-white/10 rounded-lg transition-all duration-200 border border-white/10"
                >
                  <ArrowRightOnRectangleIcon className="w-4 h-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 relative">
        {/* Tabs - Modern Segmented Control */}
        <div className="mb-8">
          <nav className="inline-flex border border-border/60 bg-card/60 backdrop-blur-xl rounded-xl p-1.5 shadow-sm">
            {[
              { id: 'overview', name: 'Overview', icon: ChartBarSquareIcon },
              { id: 'users', name: 'Users', icon: UserGroupIcon },
              { id: 'tasks', name: 'Tasks', icon: ClipboardDocumentListIcon },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => pushTab(tab.id as 'overview' | 'users' | 'tasks')}
                className={`${
                  activeTab === (tab.id as any)
                    ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-foreground shadow-sm border border-purple-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                } flex items-center justify-center gap-2 py-2.5 px-6 rounded-lg font-medium text-sm transition-all duration-200`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.name}
              </button>
            ))}
          </nav>
          
          {/* Additional Admin Actions */}
          <button
            onClick={() => router.push('/admin/reports')}
            className="ml-3 inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-medium text-sm bg-gradient-to-r from-red-500/20 to-orange-500/20 hover:from-red-500/30 hover:to-orange-500/30 text-red-300 border border-red-500/30 transition-all duration-200 shadow-sm hover:scale-105"
          >
            <FlagIcon className="w-4 h-4" />
            Reports
          </button>
          <button
            onClick={() => router.push('/admin/waitlist')}
            className="ml-3 inline-flex items-center gap-2 py-2.5 px-6 rounded-xl font-medium text-sm bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 text-green-300 border border-green-500/30 transition-all duration-200 shadow-sm hover:scale-105"
          >
            <UsersIcon className="w-4 h-4" />
            Waitlist
          </button>
        </div>

        {/* Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-xl border border-blue-500/30">
                    <UsersIcon className="w-7 h-7 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Users</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">{stats.totalUsers}</p>
                  </div>
                </div>
              </div>
              <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
                    <DocumentTextIcon className="w-7 h-7 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Tasks</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{stats.totalTasks}</p>
                  </div>
                </div>
              </div>
              <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl p-6 shadow-card hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/30">
                    <BanknotesIcon className="w-7 h-7 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                    <p className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">₹{stats.totalRevenue}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card/60 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
            <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">User</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Role</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">University</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Tasks</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Joined</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-foreground">{user.name}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            user.role === 'ADMIN'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}>{user.role}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{user.university || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                          Posted: {user._count?.postedTasks ?? 0} | Accepted: {user._count?.acceptedTasks ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openUserModal(user.id)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all"
                              aria-label={`View ${user.name}`}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            {user.role !== 'ADMIN' && !user.isSuspended && (
                              <button 
                                onClick={() => suspendUser(user.id, user.name)} 
                                className="p-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 rounded-lg border border-orange-500/30 transition-all"
                                aria-label={`Suspend ${user.name}`}
                              >
                                <NoSymbolIcon className="w-4 h-4" />
                              </button>
                            )}
                            {user.isSuspended && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
                                Suspended
                              </span>
                            )}
                            {user.role !== 'ADMIN' && (
                              <button 
                                onClick={() => deleteUser(user.id, user.name)} 
                                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-all"
                              >
                                <TrashIcon className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-card/60 border border-border/60 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
              />
            </div>
            <div className="border border-border/60 bg-card/85 backdrop-blur-2xl rounded-2xl shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/60">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Task</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Budget</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Poster</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Accepter</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Created</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground">{task.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            task.status === 'COMPLETED'
                              ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : task.status === 'CANCELLED'
                              ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                              : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                          }`}>{task.status}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">₹{task.budget}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{task.poster.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{task.accepter?.name || 'None'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{new Date(task.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => openTaskModal(task.id)}
                              className="p-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-lg border border-blue-500/30 transition-all"
                              aria-label={`View task ${task.title}`}
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => deleteTask(task.id, task.title)} 
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg border border-red-500/30 transition-all"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      <Dialog
        open={userModalOpen}
        onOpenChange={(open) => {
          setUserModalOpen(open)
          if (!open) {
            // Clear query param while staying on current tab
            const params = new URLSearchParams(Array.from(searchParams?.entries() || []))
            params.delete('viewUser')
            router.replace(`${pathname}?${params.toString()}`)
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-left">User details</DialogTitle>
            <DialogDescription className="text-left">Full profile and recent activity</DialogDescription>
          </DialogHeader>
          {userLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-t-transparent border-white/60 animate-spin" />
            </div>
          ) : selectedUser ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">{selectedUser.name}</div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{selectedUser.email}</div>
                <div className="text-sm text-muted-foreground">Role</div>
                <div><span className={`px-2 py-1 text-xs font-medium rounded-full ${selectedUser.role === 'ADMIN' ? 'bg-red-500/20 text-red-300' : 'bg-blue-500/20 text-blue-300'}`}>{selectedUser.role}</span></div>
                <div className="text-sm text-muted-foreground">University</div>
                <div className="font-medium">{selectedUser.university || '—'}</div>
                <div className="text-sm text-muted-foreground">Location</div>
                <div className="font-medium">{selectedUser.location || '—'}</div>
                <div className="text-sm text-muted-foreground">Joined</div>
                <div className="font-medium">{new Date(selectedUser.createdAt).toLocaleDateString()}</div>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-border/60 bg-card/85 p-4">
                  <div className="text-sm text-muted-foreground mb-2">Stats</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>Rating</div>
                    <div className="text-right">{selectedUser.rating} ({selectedUser.reviewCount} reviews)</div>
                    <div>Posted tasks</div>
                    <div className="text-right">{selectedUser._count?.postedTasks ?? 0}</div>
                    <div>Accepted tasks</div>
                    <div className="text-right">{selectedUser._count?.acceptedTasks ?? 0}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/85 p-4">
                  <div className="text-sm font-medium mb-2">Recent Posted Tasks</div>
                  <div className="space-y-2 max-h-44 overflow-auto pr-1">
                    {selectedUser.postedTasks?.length ? selectedUser.postedTasks.map((t: any) => (
                      <div key={t.id} className="flex items-center justify-between text-sm">
                        <div className="truncate mr-2">{t.title}</div>
                        <div className="text-muted-foreground">{t.status}</div>
                      </div>
                    )) : <div className="text-sm text-muted-foreground">No tasks</div>}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No user selected.</div>
          )}
          <DialogFooter>
            <DialogClose className="rounded-xl px-4 py-2 bg-white/10 border border-white/20">Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Task Modal */}
      <Dialog
        open={taskModalOpen}
        onOpenChange={(open) => {
          setTaskModalOpen(open)
          if (!open) {
            const params = new URLSearchParams(Array.from(searchParams?.entries() || []))
            params.delete('viewTask')
            router.replace(`${pathname}?${params.toString()}`)
          }
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-left">Task details</DialogTitle>
            <DialogDescription className="text-left">Full task information</DialogDescription>
          </DialogHeader>
          {taskLoading ? (
            <div className="py-12 flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-2 border-t-transparent border-white/60 animate-spin" />
            </div>
          ) : selectedTask ? (
            <div className="space-y-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">{selectedTask.title}</div>
                  <div className="text-sm text-muted-foreground">Status: {selectedTask.status}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Budget</div>
                  <div className="text-2xl font-bold bg-gradient-to-r from-pink-400 to-fuchsia-400 bg-clip-text text-transparent">₹{selectedTask.budget}</div>
                </div>
              </div>
              {selectedTask.description && (
                <div className="rounded-xl border border-border/60 bg-card/85 p-4">
                  <div className="text-sm font-medium mb-2">Description</div>
                  <p className="text-sm text-foreground/90 whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border/60 bg-card/85 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Poster</div>
                  <div className="font-medium">{selectedTask.poster?.name}</div>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/85 p-4">
                  <div className="text-sm text-muted-foreground mb-1">Accepter</div>
                  <div className="font-medium">{selectedTask.accepter?.name || 'None'}</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">Created: {new Date(selectedTask.createdAt).toLocaleString()}</div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No task selected.</div>
          )}
          <DialogFooter>
            <DialogClose className="rounded-xl px-4 py-2 bg-white/10 border border-white/20">Close</DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend User Dialog */}
      <Dialog open={suspendDialog.isOpen} onOpenChange={(open) => !open && setSuspendDialog({ isOpen: false, userId: 0, userName: '', reason: '', sendEmail: true })}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-left">Suspend User</DialogTitle>
            <DialogDescription className="text-left">
              Suspend {suspendDialog.userName}'s account
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason for suspension:</label>
              <textarea
                className="w-full px-3 py-2 bg-surface/50 border border-border/40 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
                rows={3}
                placeholder="Enter reason for suspension..."
                value={suspendDialog.reason}
                onChange={(e) => setSuspendDialog(p => ({ ...p, reason: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="sendEmail"
                checked={suspendDialog.sendEmail}
                onChange={(e) => setSuspendDialog(p => ({ ...p, sendEmail: e.target.checked }))}
                className="rounded border-border/40"
              />
              <label htmlFor="sendEmail" className="text-sm text-foreground cursor-pointer">
                Send suspension email to user
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose className="rounded-xl px-4 py-2 bg-white/10 border border-white/20">Cancel</DialogClose>
            <button
              onClick={handleSuspendUser}
              className="rounded-xl px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 border border-orange-500/30 transition-all"
            >
              Suspend User
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog((p) => ({ ...p, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
      />
    </div>

  )
}
