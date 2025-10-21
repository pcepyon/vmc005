import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import { ReviewsParamsSchema, CreateReviewRequestSchema } from './schema';
import { getReviewsByPlaceId, createReview } from './service';
import {
  reviewErrorCodes,
  type ReviewServiceError,
} from './error';

export const registerReviewsRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/places/:place_id/reviews', async (c) => {
    const parsedParams = ReviewsParamsSchema.safeParse({
      place_id: c.req.param('place_id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_PARAMS',
          '장소 ID가 유효하지 않습니다.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getReviewsByPlaceId(
      supabase,
      parsedParams.data.place_id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.fetchError) {
        logger.error('리뷰 조회 실패', errorResult.error.message);
      } else if (errorResult.error.code === reviewErrorCodes.placeNotFound) {
        logger.warn('존재하지 않는 장소', parsedParams.data.place_id);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.post('/api/reviews', async (c) => {
    const body = await c.req.json();
    const parsedBody = CreateReviewRequestSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_REVIEW_REQUEST',
          '리뷰 요청 데이터가 올바르지 않습니다',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await createReview(supabase, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReviewServiceError, unknown>;

      if (errorResult.error.code === reviewErrorCodes.createError) {
        logger.error('Failed to create review', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
