'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ReviewForm } from './ReviewForm'

interface ReviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  taskId: string
  receiverId: string
  partnerName: string
  onSubmitted?: () => void
}

export default function ReviewModal({ open, onOpenChange, taskId, receiverId, partnerName, onSubmitted }: ReviewModalProps) {
  const [submitted, setSubmitted] = useState(false)

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) setSubmitted(false); onOpenChange(v) }}>
      <DialogContent className="sm:max-w-lg">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <DialogHeader>
            <DialogTitle>How was your experience working with {partnerName}?</DialogTitle>
            <DialogDescription>
              Please leave an honest rating and short comment — it helps build trust on the platform.
            </DialogDescription>
          </DialogHeader>

          {!submitted ? (
            <div className="mt-4">
              <ReviewForm
                taskId={taskId}
                receiverId={receiverId}
                onReviewSubmitted={() => {
                  setSubmitted(true)
                  // small delay before closing so user sees success
                  setTimeout(() => {
                    onOpenChange(false)
                    if (onSubmitted) onSubmitted()
                    setSubmitted(false)
                  }, 1200)
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="text-4xl">✅</div>
              <div className="mt-3 text-lg font-medium">Review submitted!</div>
            </div>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Close</Button>
            </DialogClose>
          </DialogFooter>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
