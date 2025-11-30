'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/use-toast'
import { Ban, UserX } from 'lucide-react'

interface BlockUserButtonProps {
  userId: string
  userName?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  onBlockSuccess?: () => void
}

export function BlockUserButton({
  userId,
  userName = 'this user',
  variant = 'ghost',
  onBlockSuccess,
}: BlockUserButtonProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [blocking, setBlocking] = useState(false)

  const handleBlock = async () => {
    setBlocking(true)

    try {
      const res = await fetch('/api/users/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blockedId: userId,
          reason: reason.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to block user')
      }

      toast({
        title: 'User blocked',
        description: data.message,
      })

      setOpen(false)
      setReason('')
      onBlockSuccess?.()
    } catch (error) {
      console.error('Error blocking user:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to block user',
        variant: 'destructive',
      })
    } finally {
      setBlocking(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size="sm" className="gap-2">
          <Ban className="h-4 w-4" />
          Block
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Block {userName}?</DialogTitle>
          <DialogDescription>
            You won't see each other's profiles, tasks, or messages. This action can be undone later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Why are you blocking this user?"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={blocking}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleBlock} disabled={blocking} className="gap-2">
            <UserX className="h-4 w-4" />
            {blocking ? 'Blocking...' : 'Block user'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
