'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { UserX, Ban } from 'lucide-react'

interface BlockedUser {
  id: string
  blockedUser: {
    id: string
    name: string
    avatar?: string | null
    university: string
  }
  reason?: string | null
  createdAt: string
}

export default function BlockedUsersPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [unblocking, setUnblocking] = useState<string | null>(null)

  useEffect(() => {
    fetchBlockedUsers()
  }, [])

  const fetchBlockedUsers = async () => {
    try {
      const res = await fetch('/api/users/block')
      if (!res.ok) {
        throw new Error('Failed to fetch blocked users')
      }
      const data = await res.json()
      setBlockedUsers(data)
    } catch (error) {
      console.error('Error fetching blocked users:', error)
      toast({
        title: 'Error',
        description: 'Failed to load blocked users',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (userId: string) => {
    setUnblocking(userId)

    try {
      const res = await fetch('/api/users/block', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockedId: userId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to unblock user')
      }

      toast({
        title: 'User unblocked',
        description: data.message,
      })

      // Remove from list
      setBlockedUsers(blockedUsers.filter(b => b.blockedUser.id !== userId))
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to unblock user',
        variant: 'destructive',
      })
    } finally {
      setUnblocking(null)
    }
  }

  if (!session) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-2 border-border border-t-purple-500 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading blocked users...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Ban className="h-8 w-8" />
          Blocked Users
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage users you've blocked. You won't see each other's profiles, tasks, or messages.
        </p>
      </div>

      {blockedUsers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <UserX className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">You haven't blocked anyone yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {blockedUsers.map((block) => (
            <Card key={block.id}>
              <CardContent className="py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-surface text-lg font-semibold">
                      {block.blockedUser.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{block.blockedUser.name}</p>
                      <p className="text-sm text-muted-foreground">{block.blockedUser.university}</p>
                      {block.reason && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Reason: {block.reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Blocked on {new Date(block.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => handleUnblock(block.blockedUser.id)}
                    disabled={unblocking === block.blockedUser.id}
                  >
                    {unblocking === block.blockedUser.id ? 'Unblocking...' : 'Unblock'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
