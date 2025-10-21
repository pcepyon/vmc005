import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type { ReviewsResponse } from '../lib/dto';

interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export const useReviews = (placeId: string | null) => {
  return useQuery({
    queryKey: ['reviews', placeId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<ReviewsResponse>>(
        `/api/places/${placeId}/reviews`
      );
      return response.data.data;
    },
    enabled: !!placeId,
    staleTime: 30 * 1000,
  });
};
