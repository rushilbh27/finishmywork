"use client"

import * as React from 'react'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

const schema = z.object({
  title: z.string().trim().min(3, 'Title must be at least 3 characters'),
  subject: z.string().min(1, 'Please select a subject'),
  description: z.string().trim().min(10, 'Description must be at least 10 characters'),
  deadlineDate: z.string().min(1, 'Please choose a deadline date'),
  deadlineTime: z.string().optional(),
  budget: z.coerce
    .number({ required_error: 'Budget is required', invalid_type_error: 'Budget must be a number' })
    .gt(0, 'Budget must be greater than 0'),
  location: z.string().trim().min(1, 'Location is required'),
})

type FormValues = z.infer<typeof schema>

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Computer Science',
  'Economics',
  'Biology',
  'Literature',
  'Other',
] as const

interface PostTaskDialogProps {
  trigger?: React.ReactNode
  children?: React.ReactNode
  onCreated?: (task: any) => void
}

export function PostTaskDialog({ trigger, children, onCreated }: PostTaskDialogProps) {
  const [open, setOpen] = React.useState(false)
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change to give immediate feedback
      defaultValues: {
      title: '',
      subject: SUBJECTS[0],
      description: '',
      deadlineDate: '',
      deadlineTime: '',
        budget: 0,
      location: '',
    },
  })

  const handleClose = React.useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  const onSubmit = async (values: FormValues) => {
    console.log('Form submitted with values:', values) // Debug log
    
    if (!session?.user?.id) {
      toast({ title: 'Please sign in', description: 'You need to be signed in to post a task.' })
      return
    }

    try {
      const deadline =
        values.deadlineTime && values.deadlineTime.length > 0
          ? `${values.deadlineDate}T${values.deadlineTime}`
          : `${values.deadlineDate}T23:59`

      const payload = {
        title: values.title.trim(),
        description: values.description.trim(),
        subject: values.subject,
        deadline,
        budget: values.budget, // This is now already a number from the schema transform
        posterId: session.user.id,
        location: values.location.trim(),
      }

      console.log('Submitting task payload:', payload) // Debug log

      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      console.log('Response status:', response.status) // Debug log
      console.log('Response ok:', response.ok) // Debug log

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        console.error('API Error response:', data) // Debug log
        throw new Error(data.message || 'Failed to post task')
      }

      const task = await response.json()
      console.log('Task created successfully:', task) // Debug log
      
      toast({
        title: 'Task posted successfully!',
        description: 'Your study request is now live for the community.',
      })
      onCreated?.(task)
      handleClose()
      router.refresh()
    } catch (error) {
      console.error('Task creation error:', error)
      toast({
        title: 'Unable to post task',
        description:
          error instanceof Error ? error.message : 'Unexpected error, please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        // If user tries to open and is not signed in, redirect to sign in
        if (next && !session?.user?.id) {
          router.push('/auth/signin')
          return
        }
        setOpen(next)
      }}
    >
      <DialogTrigger asChild>
        {trigger ??
          children ?? (
            <Button variant="gradient" className="rounded-2xl">
              Post Task
            </Button>
          )}
      </DialogTrigger>
      <DialogContent className="max-w-xl border-border/60 bg-card/95 backdrop-blur-2xl shadow-[0_30px_90px_rgba(15,23,42,0.45)] sm:max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', stiffness: 240, damping: 22 }}
          className="space-y-6"
        >
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-semibold text-foreground">
              Post a new task
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Share what you need help with — the community will see this instantly.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[70vh] overflow-y-auto">
            <div className="space-y-5 pb-20"> {/* CORE UX FIX 2: Add bottom padding to prevent button overlap */}
              <Field label="Task title" error={errors.title?.message}>
                <Input
                  placeholder="e.g., Need help with calculus assignment"
                  {...register('title')}
                  className="rounded-xl bg-surface/90 border-border/60"
                />
              </Field>

              <Field label="Subject" error={errors.subject?.message}>
                <select
                  {...register('subject')}
                  className={cn(
                    'h-10 w-full rounded-xl border border-border/60 bg-surface/90 px-3 text-sm text-foreground',
                    'focus-visible:ring-[3px] focus-visible:ring-[var(--accent-from)] outline-none transition',
                  )}
                >
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject} className="bg-background text-foreground">
                      {subject}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Description" error={errors.description?.message}>
                <Textarea
                  rows={4}
                  placeholder="Describe what you need help with, expectations, deadline details, preferred meeting format..."
                  {...register('description')}
                  className="rounded-xl bg-surface/90 border-border/60"
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Deadline date" error={errors.deadlineDate?.message}>
                  <Input 
                    type="date" 
                    {...register('deadlineDate')} 
                    className="rounded-xl bg-surface/90 border-border/60"
                    min={new Date().toISOString().split('T')[0]} // Prevent past dates
                  />
                </Field>
                <Field label="Deadline time (optional)" error={errors.deadlineTime?.message}>
                  <Input type="time" {...register('deadlineTime')} className="rounded-xl bg-surface/90 border-border/60" />
                </Field>
              </div>
              
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Budget (₹)" error={errors.budget?.message}>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  placeholder="e.g., 500"
                  {...register('budget', { valueAsNumber: true })}
                  className="rounded-xl bg-surface/90 border-border/60"
                  onKeyDown={(e) => {
                    // Prevent decimal point for budget
                    if (e.key === '.' || e.key === ',') {
                      e.preventDefault()
                    }
                  }}
                />
              </Field>
              <Field label="Location" error={errors.location?.message}>
                <Input
                  placeholder="e.g., Online, Campus library, Zoom"
                  {...register('location')}
                  className="rounded-xl bg-surface/90 border-border/60"
                />
              </Field>
            </div>
            </div> {/* CORE UX FIX 2: Close scrollable content div */}

            {/* CORE UX FIX 2: Sticky action bar to ensure Submit button is always visible on Windows */}
            <div className="sticky bottom-0 flex items-center justify-end gap-3 pt-4 bg-card border-t border-border/30">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="gradient"
                className="rounded-xl px-6"
              >
                {isSubmitting ? 'Posting…' : 'Post task'}
              </Button>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      {children}
      {error ? <p className="text-xs text-red-400">{error}</p> : null}
    </div>
  )
}
