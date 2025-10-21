import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import type { AppConfig } from '@/backend/hono/context';
import {
  NaverPlaceSchema,
  PlaceTableRowSchema,
  PlaceResponseSchema,
  PlacesWithReviewsItemSchema,
  type NaverPlace,
  type PlaceResponse,
  type PlacesWithReviewsResponse,
  type SearchPlacesResponse,
  type PlaceRow,
} from './schema';
import {
  placeErrorCodes,
  type PlaceServiceError,
} from './error';

const PLACES_TABLE = 'places';

// ============================================================
// 네이버 장소 검색 API 호출
// ============================================================

interface NaverSearchApiResponse {
  lastBuildDate: string;
  total: number;
  start: number;
  display: number;
  items: Array<{
    title: string;
    link: string;
    category: string;
    description: string;
    telephone: string;
    address: string;
    roadAddress: string;
    mapx: string;
    mapy: string;
  }>;
}

const htmlDecode = (input: string): string => {
  return input
    .replace(/<b>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
};

const convertNaverCoordinates = (mapx: string, mapy: string): { latitude: number; longitude: number } => {
  const longitude = Number.parseFloat(mapx) / 10000000;
  const latitude = Number.parseFloat(mapy) / 10000000;
  return { latitude, longitude };
};

export const searchPlaces = async (
  config: AppConfig,
  query: string,
  display: number = 5,
): Promise<HandlerResult<SearchPlacesResponse, PlaceServiceError, unknown>> => {
  try {
    const url = new URL('https://openapi.naver.com/v1/search/local.json');
    url.searchParams.set('query', query);
    url.searchParams.set('display', display.toString());

    const response = await fetch(url.toString(), {
      headers: {
        'X-Naver-Client-Id': config.naver.searchClientId,
        'X-Naver-Client-Secret': config.naver.searchClientSecret,
      },
    });

    if (!response.ok) {
      return failure(
        500,
        placeErrorCodes.naverApiError,
        `네이버 API 호출 실패: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as NaverSearchApiResponse;

    const places: NaverPlace[] = data.items.map((item) => {
      const { latitude, longitude } = convertNaverCoordinates(item.mapx, item.mapy);

      return {
        id: `${item.mapx}_${item.mapy}`,
        name: htmlDecode(item.title),
        address: item.address,
        roadAddress: item.roadAddress || undefined,
        phone: item.telephone || undefined,
        latitude,
        longitude,
        category: item.category || undefined,
      };
    });

    const searchResponse: SearchPlacesResponse = {
      places,
      total: data.total,
    };

    return success(searchResponse);
  } catch (error) {
    return failure(
      500,
      placeErrorCodes.searchError,
      `장소 검색 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

// ============================================================
// 네이버 장소 ID로 조회 또는 생성
// ============================================================

export const getPlaceByNaverId = async (
  client: SupabaseClient,
  config: AppConfig,
  naverPlaceId: string,
  providedPlaceData?: NaverPlace,
): Promise<HandlerResult<PlaceResponse, PlaceServiceError, unknown>> => {
  const { data: existingPlace, error: fetchError } = await client
    .from(PLACES_TABLE)
    .select('id, naver_place_id, name, address, phone, latitude, longitude, created_at, updated_at')
    .eq('naver_place_id', naverPlaceId)
    .maybeSingle<PlaceRow>();

  if (fetchError) {
    return failure(500, placeErrorCodes.fetchError, fetchError.message);
  }

  if (existingPlace) {
    const rowParse = PlaceTableRowSchema.safeParse(existingPlace);

    if (!rowParse.success) {
      return failure(
        500,
        placeErrorCodes.validationError,
        '장소 데이터 검증 실패',
        rowParse.error.format(),
      );
    }

    const mapped: PlaceResponse = {
      id: rowParse.data.id,
      naverPlaceId: rowParse.data.naver_place_id,
      name: rowParse.data.name,
      address: rowParse.data.address,
      phone: rowParse.data.phone,
      latitude: rowParse.data.latitude,
      longitude: rowParse.data.longitude,
      createdAt: rowParse.data.created_at,
      updatedAt: rowParse.data.updated_at,
    };

    const parsed = PlaceResponseSchema.safeParse(mapped);

    if (!parsed.success) {
      return failure(
        500,
        placeErrorCodes.validationError,
        '장소 응답 검증 실패',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  }

  let placeData: NaverPlace;

  if (providedPlaceData) {
    placeData = providedPlaceData;
  } else {
    const searchResult = await searchPlaces(config, naverPlaceId, 1);

    if (!searchResult.ok) {
      return searchResult as HandlerResult<PlaceResponse, PlaceServiceError, unknown>;
    }

    if (searchResult.data.places.length === 0) {
      return failure(404, placeErrorCodes.notFound, '장소를 찾을 수 없습니다');
    }

    placeData = searchResult.data.places[0];
  }

  const { data: newPlace, error: insertError } = await client
    .from(PLACES_TABLE)
    .insert({
      naver_place_id: naverPlaceId,
      name: placeData.name,
      address: placeData.address,
      phone: placeData.phone,
      latitude: placeData.latitude,
      longitude: placeData.longitude,
    })
    .select('id, naver_place_id, name, address, phone, latitude, longitude, created_at, updated_at')
    .single<PlaceRow>();

  if (insertError) {
    return failure(500, placeErrorCodes.createError, insertError.message);
  }

  if (!newPlace) {
    return failure(500, placeErrorCodes.createError, '장소 생성 실패');
  }

  const rowParse = PlaceTableRowSchema.safeParse(newPlace);

  if (!rowParse.success) {
    return failure(
      500,
      placeErrorCodes.validationError,
      '장소 데이터 검증 실패',
      rowParse.error.format(),
    );
  }

  const mapped: PlaceResponse = {
    id: rowParse.data.id,
    naverPlaceId: rowParse.data.naver_place_id,
    name: rowParse.data.name,
    address: rowParse.data.address,
    phone: rowParse.data.phone,
    latitude: rowParse.data.latitude,
    longitude: rowParse.data.longitude,
    createdAt: rowParse.data.created_at,
    updatedAt: rowParse.data.updated_at,
  };

  const parsed = PlaceResponseSchema.safeParse(mapped);

  if (!parsed.success) {
    return failure(
      500,
      placeErrorCodes.validationError,
      '장소 응답 검증 실패',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

// ============================================================
// 리뷰가 있는 장소 목록 조회
// ============================================================

export const getPlacesWithReviews = async (
  client: SupabaseClient,
): Promise<HandlerResult<PlacesWithReviewsResponse, PlaceServiceError, unknown>> => {
  const { data, error } = await client
    .from(PLACES_TABLE)
    .select('id, naver_place_id, name, latitude, longitude, reviews!inner(id)')
    .order('name');

  if (error) {
    return failure(500, placeErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return success([]);
  }

  const uniquePlaces = new Map<string, PlacesWithReviewsResponse[number]>();

  for (const row of data) {
    if (!uniquePlaces.has(row.id)) {
      const mapped = {
        id: row.id,
        naverPlaceId: row.naver_place_id,
        name: row.name,
        latitude: row.latitude,
        longitude: row.longitude,
      };

      const parsed = PlacesWithReviewsItemSchema.safeParse(mapped);

      if (parsed.success) {
        uniquePlaces.set(row.id, parsed.data);
      }
    }
  }

  return success(Array.from(uniquePlaces.values()));
};
