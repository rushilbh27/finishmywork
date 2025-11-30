'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeftIcon,
  StarIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  CalendarIcon,
  MapPinIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline'
import { ReportDialog } from '@/components/ReportDialog'
import { BlockUserButton } from '@/components/BlockUserButton'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  name: string
  email: string
  avatar?: string | null
  bio?: string | null
  university?: string | null
  major?: string | null
  year?: string | null
  location?: string | null
  rating: number
  reviewCount: number
  createdAt: string
  _count: {
    postedTasks: number
    acceptedTasks: number
    completedTasks: number
  }
}

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  reviewer: {
    id: string
    name: string
    avatar?: string | null
  }
  task?: {
    id: string
    title: string
  }
}

export default function UserProfilePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isOwnProfile = session?.user?.id === params.id

  useEffect(() => {
    fetchUserProfile()
  }, [params.id])

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const [profileRes, reviewsRes] = await Promise.all([
        fetch(`/api/users/${params.id}`),
        fetch(`/api/users/${params.id}/reviews`),
      ])

      if (!profileRes.ok) {
        throw new Error('User not found')
      }

      const profileData = await profileRes.json()
      setUser(profileData)

      if (reviewsRes.ok) {
        const reviewsData = await reviewsRes.json()
        setReviews(reviewsData)
      }
    } catch (err) {
      console.error('Error fetching user profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-purple-500" />
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-background">
        <div className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold text-foreground">{error || 'User not found'}</h1>
          <Link
            href="/tasks"
            className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-5 py-3 text-sm font-medium text-foreground transition hover:border-purple-500/60 hover:text-purple-500"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Back to tasks
          </Link>
        </div>
      </div>
    )
  }

  // Redirect to own profile if viewing self
  if (isOwnProfile) {
    router.push('/profile')
    return null
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background">
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/tasks"
            className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to tasks
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Header Card */}
            <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-start gap-6">
                    {/* Avatar */}
                    <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full border-2 border-border/60 bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-3xl font-bold text-foreground">
                      {user.name.charAt(0).toUpperCase()}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <h1 className="text-3xl font-bold text-foreground mb-2">{user.name}</h1>
                      
                      <div className="flex flex-wrap items-center gap-4 mb-4">
                        {user.university && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <AcademicCapIcon className="h-4 w-4" />
                            <span>{user.university}</span>
                          </div>
                        )}
                        {user.location && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MapPinIcon className="h-4 w-4" />
                            <span>{user.location}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-1">
                          <StarIcon className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                          <span className="text-lg font-semibold text-foreground">
                            {user.rating.toFixed(1)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({user.reviewCount} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <CalendarIcon className="h-4 w-4" />
                          <span>Joined {format(new Date(user.createdAt), 'MMM yyyy')}</span>
                        </div>
                      </div>

                      {user.major && (
                        <div className="mb-4">
                          <Badge variant="secondary" className="text-sm">
                            {user.major}
                            {user.year && ` • ${user.year}`}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {session?.user && (
                    <div className="flex items-center gap-2">
                      <ReportDialog
                        type="USER"
                        reportedId={user.id}
                        triggerLabel=""
                        triggerVariant="ghost"
                      />
                      <BlockUserButton
                        userId={user.id}
                        userName={user.name}
                        variant="ghost"
                        onBlockSuccess={() => router.push('/tasks')}
                      />
                    </div>
                  )}
                </div>

                {/* Bio */}
                {user.bio && (
                  <div className="border-t border-border/60 pt-6">
                    <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
                <CardContent className="p-6 text-center">
                  <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-2 text-blue-400" />
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {user._count.postedTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks Posted</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
                <CardContent className="p-6 text-center">
                  <CheckCircleIcon className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {user._count.completedTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
                <CardContent className="p-6 text-center">
                  <ClipboardDocumentListIcon className="h-8 w-8 mx-auto mb-2 text-purple-400" />
                  <p className="text-2xl font-bold text-foreground mb-1">
                    {user._count.acceptedTasks}
                  </p>
                  <p className="text-xs text-muted-foreground">Tasks Accepted</p>
                </CardContent>
              </Card>
            </div>

            {/* Reviews Section */}
            <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5 text-yellow-400" />
                  Reviews ({reviews.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <div className="text-center py-12">
                    <StarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-muted-foreground">No reviews yet</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b border-border/60 pb-6 last:border-0 last:pb-0">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-surface/70 text-sm font-semibold">
                              {review.reviewer.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{review.reviewer.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(review.createdAt), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <StarIcon
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'text-yellow-400 fill-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                        )}
                        {review.task && (
                          <Link
                            href={`/tasks/${review.task.id}`}
                            className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            Task: {review.task.title}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Quick Stats */}
          <div className="space-y-6">
            <Card className="border-border/60 bg-card/85 backdrop-blur-2xl">
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Average Rating</span>
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-semibold text-foreground">{user.rating.toFixed(1)}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Reviews</span>
                  <span className="font-semibold text-foreground">{user.reviewCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks Posted</span>
                  <span className="font-semibold text-foreground">{user._count.postedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tasks Completed</span>
                  <span className="font-semibold text-foreground">{user._count.completedTasks}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Member Since</span>
                  <span className="font-semibold text-foreground">
                    {format(new Date(user.createdAt), 'MMM yyyy')}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
