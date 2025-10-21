'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { CreateReviewRequest, ReviewResponse } from '@/features/reviews/lib/dto';

const postReview = async (data: CreateReviewRequest): Promise<ReviewResponse> => {
  try {
    const { data: responseData } = await apiClient.post('/api/reviews', data);
    return responseData;
  } catch (error) {
    const message = extractApiErrorMessage(error, '리뷰 작성에 실패했습니다');
    throw new Error(message);
  }
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: postReview,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['reviews', variables.place_id],
      });
    },
  });
};
