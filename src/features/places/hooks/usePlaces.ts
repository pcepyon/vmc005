import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import type {
  PlacesWithReviewsResponse,
  PlaceResponse,
  SearchPlacesResponse,
} from '../lib/dto';

interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export const usePlacesWithReviews = () => {
  return useQuery({
    queryKey: ['places', 'with-reviews'],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<PlacesWithReviewsResponse>>(
        '/api/places/with-reviews'
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useSearchPlaces = (query: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['places', 'search', query],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<SearchPlacesResponse>>(
        '/api/places/search',
        { params: { query, display: 5 } }
      );
      return response.data.data;
    },
    enabled: !!query && enabled,
    staleTime: 1 * 60 * 1000,
  });
};

export const usePlaceByNaverId = (naverPlaceId: string | null) => {
  return useQuery({
    queryKey: ['places', 'naver', naverPlaceId],
    queryFn: async () => {
      const response = await apiClient.get<ApiSuccessResponse<PlaceResponse>>(
        `/api/places/${naverPlaceId}`
      );
      return response.data.data;
    },
    enabled: !!naverPlaceId,
    staleTime: 10 * 60 * 1000,
  });
};
