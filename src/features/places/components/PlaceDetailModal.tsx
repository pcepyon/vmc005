'use client';

import { useAppStore } from '@/stores/useAppStore';
import { usePlaceByNaverId } from '../hooks/usePlaces';
import { useReviews } from '@/features/reviews/hooks/useReviews';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, MapPin, Phone, Loader2, Star } from 'lucide-react';
import { ReviewList } from '@/features/reviews/components/ReviewList';
import { ReviewStats } from '@/features/reviews/components/ReviewStats';

export const PlaceDetailModal = () => {
  const modalState = useAppStore((state) => state.modalState);
  const modalHistory = useAppStore((state) => state.modalHistory);
  const goBackModal = useAppStore((state) => state.goBackModal);

  const currentModal = modalHistory[modalHistory.length - 1];
  const naverPlaceId = currentModal?.data?.naverPlaceId || null;

  const {
    data: place,
    isLoading: isLoadingPlace,
    isError: isErrorPlace,
  } = usePlaceByNaverId(naverPlaceId);

  const {
    data: reviewsData,
    isLoading: isLoadingReviews,
    isError: isErrorReviews,
  } = useReviews(place?.id || null);

  if (modalState !== 'place-detail') return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={goBackModal}
    >
      <Card
        className="w-full max-w-3xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>장소 상세 정보</CardTitle>
          <Button variant="ghost" size="icon" onClick={goBackModal}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-6">
          {isLoadingPlace && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          )}

          {isErrorPlace && (
            <div className="p-6 text-center text-red-600">
              <p>장소 정보를 불러오는데 실패했습니다.</p>
            </div>
          )}

          {place && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-4">{place.name}</h2>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <span>{place.address}</span>
                  </div>
                  {place.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-5 w-5 text-gray-400" />
                      <span>{place.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  리뷰
                </h3>

                {isLoadingReviews && (
                  <div className="flex items-center justify-center h-20">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                )}

                {isErrorReviews && (
                  <div className="text-center text-red-600">
                    <p>리뷰를 불러오는데 실패했습니다.</p>
                  </div>
                )}

                {reviewsData && (
                  <>
                    <ReviewStats
                      avgRating={reviewsData.stats.avgRating}
                      reviewCount={reviewsData.stats.reviewCount}
                    />
                    <div className="mt-6">
                      <ReviewList reviews={reviewsData.reviews} />
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
