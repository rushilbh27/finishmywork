'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { 
  UserIcon,
  EnvelopeIcon,
  LockClosedIcon,
  CameraIcon,
  BellIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline'
import AuthRequired from '@/components/auth/AuthRequired'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import PromptDialog from '@/components/ui/PromptDialog'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  university: z.string().max(100, 'University name too long').optional(),
  major: z.string().max(100, 'Major name too long').optional(),
  year: z.string().optional(),
  location: z.string().min(2, 'Location is required').max(100, 'Location name too long'),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function SettingsPage() {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [showActiveTasksWarning, setShowActiveTasksWarning] = useState(false)
  const [activeTasks, setActiveTasks] = useState<{postedTasks: any[], acceptedTasks: any[]}>({postedTasks: [], acceptedTasks: []})
  const [deletePassword, setDeletePassword] = useState('')


  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    async function fetchProfile() {
      if (!session?.user) return
      try {
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const user = await res.json()
          profileForm.reset({
            name: user.name || '',
            email: user.email || '',
            bio: user.bio || '',
            university: user.university || '',
            major: user.major || '',
            year: user.year || '',
            location: user.location || '',
          })
        }
      } catch (err) {
        // fallback to session if fetch fails
        profileForm.reset({
          name: session.user.name || '',
          email: session.user.email || '',
          bio: '',
          university: '',
          major: '',
          year: '',
          location: '',
        })
      }
    }
    fetchProfile()
  }, [session, profileForm])

  if (!mounted) return null

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <div className="animate-pulse text-gray-600 dark:text-zinc-400">Loading...</div>
      </div>
    )
  }
  
  if (!session) {
    return <AuthRequired />
  }

  const onProfileSubmit = async (data: ProfileForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        await update() // Refresh session data
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      })

      if (response.ok) {
        toast.success('Password updated successfully!')
        passwordForm.reset()
      } else {
        const error = await response.json()
        toast.error(error.message || 'Failed to update password')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Please upload a valid image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      setIsLoading(true)
      const response = await fetch('/api/user/avatar', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const { avatarUrl } = await response.json()
        toast.success('Profile picture updated!')
        await update({ avatar: avatarUrl }) // Update session
      } else {
        toast.error('Failed to upload image')
        setAvatarPreview(null)
      }
    } catch (error) {
      toast.error('Failed to upload image')
      setAvatarPreview(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    setShowDeleteConfirm(false)
    setShowPasswordPrompt(true)
  }

  const handlePasswordConfirm = async (password: string, forceDelete = false) => {
    try {
      setDeleteLoading(true)
      const response = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, forceDelete }),
      })

      if (response.ok) {
        toast.success('Account deleted successfully')
        setShowPasswordPrompt(false)
        setShowActiveTasksWarning(false)
        router.push('/')
      } else {
        const error = await response.json()
        
        if (error.error === 'ACTIVE_TASKS_FOUND') {
          // Show active tasks warning with force delete option
          setActiveTasks({
            postedTasks: error.postedTasks || [],
            acceptedTasks: error.acceptedTasks || []
          })
          setDeletePassword(password)
          setShowPasswordPrompt(false)
          setShowActiveTasksWarning(true)
        } else {
          toast.error(error.error || error.message || 'Failed to delete account')
        }
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleForceDelete = async () => {
    await handlePasswordConfirm(deletePassword, true)
  }

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="border border-border/60 bg-card/85 shadow-card backdrop-blur-2xl rounded-2xl overflow-hidden">
          <div className="border-b border-border/60">
            <nav className="flex">
              {[
                { id: 'profile', name: 'Profile', icon: UserIcon },
                { id: 'password', name: 'Password', icon: LockClosedIcon },
                { id: 'preferences', name: 'Preferences', icon: BellIcon },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 ${
                    activeTab === tab.id
                      ? 'border-[color:var(--accent-from)] text-foreground bg-surface/50'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-8">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-8">
                <div>
                  {/* Profile Form */}
                  <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Full Name *
                        </label>
                        <Input
                          {...profileForm.register('name')}
                          className="rounded-xl bg-surface/50"
                          placeholder="Your full name"
                        />
                        {profileForm.formState.errors.name && (
                          <p className="mt-2 text-xs text-red-400">{profileForm.formState.errors.name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Email Address *
                        </label>
                        <Input
                          {...profileForm.register('email')}
                          type="email"
                          className="rounded-xl bg-surface/50"
                          placeholder="your@email.com"
                        />
                        {profileForm.formState.errors.email && (
                          <p className="mt-2 text-xs text-red-400">{profileForm.formState.errors.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          University/College
                        </label>
                        <Input
                          {...profileForm.register('university')}
                          className="rounded-xl bg-surface/50"
                          placeholder="e.g., University of Pune"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Location *
                        </label>
                        <Input
                          {...profileForm.register('location')}
                          className="rounded-xl bg-surface/50"
                          placeholder="e.g., FC Road, Pune"
                        />
                        {profileForm.formState.errors.location && (
                          <p className="mt-2 text-xs text-red-400">{profileForm.formState.errors.location.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                          Major/Field of Study
                        </label>
                        <Input
                          {...profileForm.register('major')}
                          className="rounded-xl bg-surface/50"
                          placeholder="e.g., Computer Science"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-2 block">
                          Academic Year
                        </label>
                        <Select
                          value={profileForm.watch('year') || undefined}
                          onValueChange={(val) =>
                            profileForm.setValue('year', val, {
                              shouldDirty: true,
                              shouldTouch: true,
                              shouldValidate: true,
                            })
                          }
                        >
                          <SelectTrigger className="w-full rounded-xl bg-surface/50 h-11 px-4">
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="10th Grade">10th Grade (High School)</SelectItem>
                            <SelectItem value="11th Grade">11th Grade (Higher Secondary)</SelectItem>
                            <SelectItem value="12th Grade">12th Grade (Higher Secondary)</SelectItem>
                            <SelectItem value="1st Year">1st Year (Undergraduate)</SelectItem>
                            <SelectItem value="2nd Year">2nd Year (Undergraduate)</SelectItem>
                            <SelectItem value="3rd Year">3rd Year (Undergraduate)</SelectItem>
                            <SelectItem value="4th Year">4th Year (Undergraduate)</SelectItem>
                            <SelectItem value="Postgraduate">Postgraduate (Masters/PhD)</SelectItem>
                            <SelectItem value="PhD">PhD</SelectItem>
                            <SelectItem value="Graduate">Graduate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Bio
                      </label>
                      <Textarea
                        {...profileForm.register('bio')}
                        rows={4}
                        className="rounded-xl bg-surface/50 resize-none"
                        placeholder="Tell us about yourself, your skills, and what you're passionate about..."
                      />
                      {profileForm.formState.errors.bio && (
                        <p className="mt-2 text-xs text-red-400">{profileForm.formState.errors.bio.message}</p>
                      )}
                    </div>

                    {/* Sticky save bar for better UX */}
                    <div className="sticky bottom-0 flex justify-end bg-card/80 border-t border-border/60 pt-4 -mx-8 px-8 rounded-b-2xl">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="rounded-xl px-6 py-2 font-medium text-white bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] disabled:opacity-60"
                      >
                        {isLoading ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <div className="max-w-2xl mx-auto">
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Change Password</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ensure your account is using a long, random password to stay secure.
                  </p>
                </div>

                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="space-y-6">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2.5 block">
                        Current Password
                      </label>
                      <div className="relative">
                        <Input
                          {...passwordForm.register('currentPassword')}
                          type={showCurrentPassword ? 'text' : 'password'}
                          placeholder="Current password"
                          className="rounded-xl bg-surface/50 h-11 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'}
                        >
                          {showCurrentPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.currentPassword && (
                        <p className="mt-2 text-xs text-red-400">{passwordForm.formState.errors.currentPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2.5 block">
                        New Password
                      </label>
                      <div className="relative">
                        <Input
                          {...passwordForm.register('newPassword')}
                          type={showNewPassword ? 'text' : 'password'}
                          placeholder="Create a new password"
                          className="rounded-xl bg-surface/50 h-11 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showNewPassword ? 'Hide new password' : 'Show new password'}
                        >
                          {showNewPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.newPassword && (
                        <p className="mt-2 text-xs text-red-400">{passwordForm.formState.errors.newPassword.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm font-medium text-foreground mb-2.5 block">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <Input
                          {...passwordForm.register('confirmPassword')}
                          type={showConfirmPassword ? 'text' : 'password'}
                          placeholder="Confirm new password"
                          className="rounded-xl bg-surface/50 h-11 pr-12"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="w-5 h-5" />
                          ) : (
                            <EyeIcon className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                      {passwordForm.formState.errors.confirmPassword && (
                        <p className="mt-2 text-xs text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="sticky bottom-0 flex justify-end bg-card/80 backdrop-blur-xl border-t border-border/60 pt-5 mt-8 -mx-8 px-8 rounded-b-2xl">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="rounded-xl px-8 py-2.5 font-medium text-white bg-gradient-to-r from-[color:var(--accent-from)] to-[color:var(--accent-to)] hover:opacity-90 transition-opacity disabled:opacity-60 shadow-sm"
                    >
                      {isLoading ? 'Updating…' : 'Update password'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">Account Preferences</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your notification settings and privacy preferences.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-border/60">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Email Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive email updates about your tasks and messages
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border/60">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Push Notifications</h4>
                      <p className="text-sm text-muted-foreground">
                        Receive push notifications for important updates
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-border/60">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Public Profile</h4>
                      <p className="text-sm text-muted-foreground">
                        Allow others to see your profile and ratings
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="border-t border-border/60 pt-8">
                  <h3 className="text-lg font-semibold text-red-500 mb-4">Danger Zone</h3>
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
                    <div className="flex items-start gap-4">
                      <TrashIcon className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
                      <div className="flex-grow">
                        <h4 className="text-sm font-semibold text-red-500 mb-2">
                          Delete Account
                        </h4>
                        <p className="text-sm text-red-400 mb-4">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isLoading ? 'Deleting...' : 'Delete Account'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleConfirmDelete}
          title="Delete Account"
          message="Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed."
          confirmText="Delete Account"
          variant="danger"
        />

        {/* Password Prompt Dialog */}
        <PromptDialog
          isOpen={showPasswordPrompt}
          onClose={() => setShowPasswordPrompt(false)}
          onConfirm={(password) => handlePasswordConfirm(password, false)}
          title="Confirm Account Deletion"
          message="Please enter your password to confirm account deletion:"
          placeholder="Enter your password"
          inputType="password"
          confirmText="Delete Account"
          isLoading={deleteLoading}
        />

        {/* Active Tasks Warning Dialog */}
        {showActiveTasksWarning && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
              <div className="fixed inset-0 bg-black/30 backdrop-blur-sm transition-opacity" />
              
              <div className="relative transform overflow-hidden rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                    <TrashIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                      Active Tasks Found
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        You have active tasks that must be handled before account deletion:
                      </p>
                      
                      {activeTasks.postedTasks.length > 0 && (
                        <div className="mt-4 text-left">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Posted Tasks ({activeTasks.postedTasks.length}):
                          </p>
                          <ul className="mt-1 space-y-1">
                            {activeTasks.postedTasks.map((task) => (
                              <li key={task.id} className="text-sm text-gray-600 dark:text-gray-400">
                                • {task.title} ({task.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {activeTasks.acceptedTasks.length > 0 && (
                        <div className="mt-4 text-left">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Accepted Tasks ({activeTasks.acceptedTasks.length}):
                          </p>
                          <ul className="mt-1 space-y-1">
                            {activeTasks.acceptedTasks.map((task) => (
                              <li key={task.id} className="text-sm text-gray-600 dark:text-gray-400">
                                • {task.title} ({task.status})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-sm text-red-700 dark:text-red-300">
                          <strong>Force Delete:</strong> Posted tasks will be cancelled and you will be withdrawn from accepted tasks. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setShowActiveTasksWarning(false)}
                    className="inline-flex w-full justify-center rounded-lg bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700/70 sm:col-start-1 sm:mt-0"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleForceDelete}
                    disabled={deleteLoading}
                    className="inline-flex w-full justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50 disabled:cursor-not-allowed sm:col-start-2"
                  >
                    {deleteLoading ? 'Deleting...' : 'Force Delete Account'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}