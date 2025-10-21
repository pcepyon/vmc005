import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  getConfig,
  type AppEnv,
} from '@/backend/hono/context';
import {
  SearchPlacesQuerySchema,
  PlaceParamsSchema,
} from './schema';
import {
  searchPlaces,
  getPlaceByNaverId,
  getPlacesWithReviews,
} from './service';
import {
  placeErrorCodes,
  type PlaceServiceError,
} from './error';

export const registerPlacesRoutes = (app: Hono<AppEnv>) => {
  app.get('/api/places/search', async (c) => {
    const parsedQuery = SearchPlacesQuerySchema.safeParse({
      query: c.req.query('query'),
      display: c.req.query('display'),
    });

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_SEARCH_PARAMS',
          '검색 파라미터가 유효하지 않습니다.',
          parsedQuery.error.format(),
        ),
      );
    }

    const config = getConfig(c);
    const logger = getLogger(c);

    const result = await searchPlaces(
      config,
      parsedQuery.data.query,
      parsedQuery.data.display,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<PlaceServiceError, unknown>;

      if (errorResult.error.code === placeErrorCodes.naverApiError) {
        logger.error('네이버 API 호출 실패', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.get('/api/places/with-reviews', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const result = await getPlacesWithReviews(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<PlaceServiceError, unknown>;

      if (errorResult.error.code === placeErrorCodes.fetchError) {
        logger.error('리뷰가 있는 장소 조회 실패', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });

  app.get('/api/places/:naver_place_id', async (c) => {
    const parsedParams = PlaceParamsSchema.safeParse({
      naver_place_id: c.req.param('naver_place_id'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          'INVALID_PLACE_PARAMS',
          '장소 ID가 유효하지 않습니다.',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const config = getConfig(c);
    const logger = getLogger(c);

    const result = await getPlaceByNaverId(
      supabase,
      config,
      parsedParams.data.naver_place_id,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<PlaceServiceError, unknown>;

      if (errorResult.error.code === placeErrorCodes.fetchError) {
        logger.error('장소 조회 실패', errorResult.error.message);
      } else if (errorResult.error.code === placeErrorCodes.createError) {
        logger.error('장소 생성 실패', errorResult.error.message);
      }

      return respond(c, result);
    }

    return respond(c, result);
  });
};
