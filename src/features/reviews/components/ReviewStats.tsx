'use client';

import { Star } from 'lucide-react';

interface ReviewStatsProps {
  avgRating: number;
  reviewCount: number;
}

export const ReviewStats = ({ avgRating, reviewCount }: ReviewStatsProps) => {
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <Star className="h-5 w-5 text-gray-300" />
            <div className="absolute inset-0 overflow-hidden w-1/2">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
          </div>
        );
      } else {
        stars.push(<Star key={i} className="h-5 w-5 text-gray-300" />);
      }
    }

    return stars;
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">{renderStars()}</div>
      <div className="text-lg font-semibold">
        {avgRating > 0 ? avgRating.toFixed(1) : '0.0'}
      </div>
      <div className="text-sm text-gray-600">({reviewCount}개의 리뷰)</div>
    </div>
  );
};
