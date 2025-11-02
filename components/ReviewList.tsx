'use client'

import { StarIcon } from '@heroicons/react/24/solid'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  comment?: string
  createdAt: string
  reviewer: {
    name: string
    avatar?: string
  }
}

interface ReviewListProps {
  reviews: Review[]
  averageRating: number
  totalReviews: number
}

export function ReviewList({ reviews, averageRating, totalReviews }: ReviewListProps) {
  return (
    <div className="space-y-6">
      {/* Rating Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Reviews & Ratings</h3>
        
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating) ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <div className="text-sm text-gray-500">{totalReviews} reviews</div>
          </div>
          
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = reviews.filter(r => r.rating === rating).length
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
              
              return (
                <div key={rating} className="flex items-center space-x-2 mb-1">
                  <span className="text-sm text-gray-600 w-2">{rating}</span>
                  <StarIcon className="h-4 w-4 text-yellow-400" />
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-8">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Individual Reviews */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <div key={review.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-primary-600">
                    {review.reviewer.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <h4 className="text-sm font-medium text-gray-900">{review.reviewer.name}</h4>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <StarIcon
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>
                
                {review.comment && (
                  <p className="text-sm text-gray-700">{review.comment}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No reviews yet.</p>
        </div>
      )}
    </div>
  )
}
