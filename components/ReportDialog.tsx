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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Flag } from 'lucide-react'

interface ReportDialogProps {
  type: 'USER' | 'TASK'
  reportedId?: string
  taskId?: string
  triggerLabel?: string
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
}

const REPORT_CATEGORIES = {
  USER: [
    'Spam or scam',
    'Harassment or bullying',
    'Inappropriate content',
    'Fake profile',
    'Other',
  ],
  TASK: [
    'Misleading information',
    'Inappropriate content',
    'Scam or fraud',
    'Duplicate posting',
    'Other',
  ],
}

export function ReportDialog({
  type,
  reportedId,
  taskId,
  triggerLabel = 'Report',
  triggerVariant = 'ghost',
}: ReportDialogProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!category || !reason.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please select a category and provide details',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          reportedId,
          taskId,
          category,
          reason,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit report')
      }

      toast({
        title: 'Report submitted',
        description: data.message,
      })

      setOpen(false)
      setCategory('')
      setReason('')
    } catch (error) {
      console.error('Error submitting report:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to submit report',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!session) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} size="sm" className="gap-2">
          <Flag className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit a report</DialogTitle>
          <DialogDescription>
            Help us keep FinishMyWork safe. Your report will be reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {REPORT_CATEGORIES[type].map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Details</Label>
            <Textarea
              id="reason"
              placeholder="Please provide specific details about why you're reporting this..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={5}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
