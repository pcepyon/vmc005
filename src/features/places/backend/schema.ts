import { z } from 'zod';

// ============================================================
// 요청 스키마
// ============================================================

export const SearchPlacesQuerySchema = z.object({
  query: z.string().min(1, '검색어를 입력해주세요'),
  display: z.coerce.number().int().min(1).max(5).default(5),
});

export type SearchPlacesQuery = z.infer<typeof SearchPlacesQuerySchema>;

export const PlaceParamsSchema = z.object({
  naver_place_id: z.string().min(1),
});

export type PlaceParams = z.infer<typeof PlaceParamsSchema>;

// ============================================================
// 네이버 API 응답 스키마
// ============================================================

export const NaverPlaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  address: z.string(),
  roadAddress: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.number(),
  longitude: z.number(),
  category: z.string().optional(),
});

export type NaverPlace = z.infer<typeof NaverPlaceSchema>;

export const SearchPlacesResponseSchema = z.object({
  places: z.array(NaverPlaceSchema),
  total: z.number(),
});

export type SearchPlacesResponse = z.infer<typeof SearchPlacesResponseSchema>;

// ============================================================
// Places 테이블 스키마
// ============================================================

export const PlaceTableRowSchema = z.object({
  id: z.string().uuid(),
  naver_place_id: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PlaceRow = z.infer<typeof PlaceTableRowSchema>;

// ============================================================
// 응답 스키마
// ============================================================

export const PlaceResponseSchema = z.object({
  id: z.string().uuid(),
  naverPlaceId: z.string(),
  name: z.string(),
  address: z.string(),
  phone: z.string().nullable(),
  latitude: z.number(),
  longitude: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PlaceResponse = z.infer<typeof PlaceResponseSchema>;

export const PlacesWithReviewsItemSchema = z.object({
  id: z.string().uuid(),
  naverPlaceId: z.string(),
  name: z.string(),
  latitude: z.number(),
  longitude: z.number(),
});

export const PlacesWithReviewsResponseSchema = z.array(PlacesWithReviewsItemSchema);

export type PlacesWithReviewsResponse = z.infer<typeof PlacesWithReviewsResponseSchema>;
