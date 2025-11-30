'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { StarIcon } from '@heroicons/react/24/solid'
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/use-toast'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Rating is required').max(5, 'Rating must be 5 or less'),
  comment: z.string().min(10, 'Comment must be at least 10 characters').optional(),
})

type ReviewForm = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  taskId: string
  receiverId: string
  onReviewSubmitted: () => void
}

export function ReviewForm({ taskId, receiverId, onReviewSubmitted }: ReviewFormProps) {
  const { toast } = useToast()
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewForm>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
    }
  })

  const rating = watch('rating')

  const onSubmit = async (data: ReviewForm) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          receiverId,
          rating: data.rating,
          comment: data.comment,
        }),
      })

      if (response.ok) {
        toast({ title: 'Review submitted successfully!', variant: 'success' })
        onReviewSubmitted()
      } else {
        const error = await response.json()
        toast({ title: error.message || 'Failed to submit review', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Something went wrong', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRatingClick = (value: number) => {
    setValue('rating', value)
  }

  const handleRatingHover = (value: number) => {
    setHoveredRating(value)
  }

  const handleRatingLeave = () => {
    setHoveredRating(0)
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Leave a Review</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => handleRatingClick(value)}
                onMouseEnter={() => handleRatingHover(value)}
                onMouseLeave={handleRatingLeave}
                className="focus:outline-none"
              >
                {value <= (hoveredRating || rating) ? (
                  <StarIcon className="h-8 w-8 text-yellow-400" />
                ) : (
                  <StarIconOutline className="h-8 w-8 text-gray-300" />
                )}
              </button>
            ))}
          </div>
          {errors.rating && (
            <p className="mt-1 text-sm text-red-600">{errors.rating.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
            Comment (optional)
          </label>
          <textarea
            {...register('comment')}
            rows={4}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Share your experience working with this person..."
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment.message}</p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={isSubmitting || rating === 0}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </form>
    </div>
  )
}
