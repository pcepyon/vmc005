'use client';

import { ReviewItem } from './ReviewItem';
import type { Review } from '../lib/dto';

interface ReviewListProps {
  reviews: Review[];
}

export const ReviewList = ({ reviews }: ReviewListProps) => {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        아직 작성된 리뷰가 없습니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
};
