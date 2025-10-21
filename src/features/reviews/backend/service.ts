import type { SupabaseClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ReviewTableRowSchema,
  ReviewSchema,
  ReviewStatsSchema,
  ReviewResponseSchema,
  type Review,
  type ReviewStats,
  type ReviewsResponse,
  type ReviewRow,
  type CreateReviewRequest,
  type ReviewResponse,
} from './schema';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from './error';

const REVIEWS_TABLE = 'reviews';
const PLACES_TABLE = 'places';
const BCRYPT_SALT_ROUNDS = 10;

// ============================================================
// 특정 장소의 리뷰 목록 및 통계 조회
// ============================================================

export const getReviewsByPlaceId = async (
  client: SupabaseClient,
  placeId: string,
): Promise<HandlerResult<ReviewsResponse, ReviewServiceError, unknown>> => {
  const { data: placeExists, error: placeError } = await client
    .from(PLACES_TABLE)
    .select('id')
    .eq('id', placeId)
    .maybeSingle();

  if (placeError) {
    return failure(500, reviewErrorCodes.fetchError, placeError.message);
  }

  if (!placeExists) {
    return failure(404, reviewErrorCodes.placeNotFound, '존재하지 않는 장소입니다');
  }

  const { data: reviewsData, error: reviewsError } = await client
    .from(REVIEWS_TABLE)
    .select('id, place_id, author_name, rating, content, created_at')
    .eq('place_id', placeId)
    .order('created_at', { ascending: false });

  if (reviewsError) {
    return failure(500, reviewErrorCodes.fetchError, reviewsError.message);
  }

  const reviews: Review[] = [];

  if (reviewsData) {
    for (const row of reviewsData) {
      const rowParse = ReviewTableRowSchema.safeParse(row);

      if (!rowParse.success) {
        continue;
      }

      const mapped: Review = {
        id: rowParse.data.id,
        placeId: rowParse.data.place_id,
        authorName: rowParse.data.author_name,
        rating: rowParse.data.rating,
        content: rowParse.data.content,
        createdAt: rowParse.data.created_at,
      };

      const parsed = ReviewSchema.safeParse(mapped);

      if (parsed.success) {
        reviews.push(parsed.data);
      }
    }
  }

  let avgRating = 0;
  const reviewCount = reviews.length;

  if (reviewCount > 0) {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    avgRating = totalRating / reviewCount;
  }

  const stats: ReviewStats = {
    avgRating: Math.round(avgRating * 10) / 10,
    reviewCount,
  };

  const statsParse = ReviewStatsSchema.safeParse(stats);

  if (!statsParse.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      '통계 데이터 검증 실패',
      statsParse.error.format(),
    );
  }

  const response: ReviewsResponse = {
    placeId,
    reviews,
    stats: statsParse.data,
  };

  return success(response);
};

// ============================================================
// 리뷰 작성
// ============================================================

export const createReview = async (
  client: SupabaseClient,
  data: CreateReviewRequest,
): Promise<HandlerResult<ReviewResponse, ReviewServiceError, unknown>> => {
  const { data: place, error: placeError } = await client
    .from(PLACES_TABLE)
    .select('id')
    .eq('id', data.place_id)
    .maybeSingle();

  if (placeError) {
    return failure(500, reviewErrorCodes.fetchError, placeError.message);
  }

  if (!place) {
    return failure(404, reviewErrorCodes.placeNotFound, '존재하지 않는 장소입니다');
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_SALT_ROUNDS);

  const { data: reviewRow, error: insertError } = await client
    .from(REVIEWS_TABLE)
    .insert({
      place_id: data.place_id,
      author_name: data.author_name,
      rating: data.rating,
      content: data.content,
      password_hash: passwordHash,
    })
    .select('id, place_id, author_name, rating, content, created_at')
    .single();

  if (insertError) {
    return failure(
      500,
      reviewErrorCodes.createError,
      '리뷰 작성에 실패했습니다',
      insertError.message,
    );
  }

  const parsed = ReviewResponseSchema.safeParse(reviewRow);

  if (!parsed.success) {
    return failure(
      500,
      reviewErrorCodes.validationError,
      '리뷰 데이터 검증에 실패했습니다',
      parsed.error.format(),
    );
  }

  return success(parsed.data, 201);
};
