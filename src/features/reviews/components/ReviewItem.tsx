'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Star, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Review } from '../lib/dto';

interface ReviewItemProps {
  review: Review;
}

export const ReviewItem = ({ review }: ReviewItemProps) => {
  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy년 MM월 dd일', { locale: ko });
    } catch {
      return dateString;
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-gray-400" />
            <span className="font-semibold">{review.authorName}</span>
          </div>
          <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
        </div>
        <p className="text-gray-700 mb-2">{review.content}</p>
        <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
      </CardContent>
    </Card>
  );
};
