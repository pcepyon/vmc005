import { z } from 'zod';

// ============================================================
// 요청 스키마
// ============================================================

export const ReviewsParamsSchema = z.object({
  place_id: z.string().uuid(),
});

export type ReviewsParams = z.infer<typeof ReviewsParamsSchema>;

// POST /api/reviews 요청 스키마
export const CreateReviewRequestSchema = z.object({
  place_id: z.string().uuid({ message: 'place_id must be a valid UUID.' }),
  author_name: z
    .string()
    .min(1, '작성자명을 입력해주세요')
    .max(100, '작성자명은 100자를 초과할 수 없습니다'),
  rating: z
    .number()
    .int('별점은 정수여야 합니다')
    .min(1, '별점은 1~5 사이여야 합니다')
    .max(5, '별점은 1~5 사이여야 합니다'),
  content: z
    .string()
    .min(1, '리뷰 내용을 입력해주세요')
    .max(500, '리뷰 내용은 500자를 초과할 수 없습니다'),
  password: z.string().regex(/^\d{4}$/, '비밀번호는 4자리 숫자여야 합니다'),
});

export type CreateReviewRequest = z.infer<typeof CreateReviewRequestSchema>;

// ============================================================
// Reviews 테이블 스키마
// ============================================================

export const ReviewTableRowSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  created_at: z.string(),
});

export type ReviewRow = z.infer<typeof ReviewTableRowSchema>;

// ============================================================
// 응답 스키마
// ============================================================

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  placeId: z.string().uuid(),
  authorName: z.string(),
  rating: z.number().int().min(1).max(5),
  content: z.string(),
  createdAt: z.string(),
});

export type Review = z.infer<typeof ReviewSchema>;

// 단일 리뷰 생성 응답 스키마
export const ReviewResponseSchema = z.object({
  id: z.string().uuid(),
  place_id: z.string().uuid(),
  author_name: z.string(),
  rating: z.number(),
  content: z.string(),
  created_at: z.string(),
});

export type ReviewResponse = z.infer<typeof ReviewResponseSchema>;

export const ReviewStatsSchema = z.object({
  avgRating: z.number().min(0).max(5),
  reviewCount: z.number().int().min(0),
});

export type ReviewStats = z.infer<typeof ReviewStatsSchema>;

export const ReviewsResponseSchema = z.object({
  placeId: z.string().uuid(),
  reviews: z.array(ReviewSchema),
  stats: ReviewStatsSchema,
});

export type ReviewsResponse = z.infer<typeof ReviewsResponseSchema>;
