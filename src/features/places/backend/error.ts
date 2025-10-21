export const placeErrorCodes = {
  searchError: 'PLACE_SEARCH_ERROR',
  naverApiError: 'NAVER_API_ERROR',
  fetchError: 'PLACE_FETCH_ERROR',
  notFound: 'PLACE_NOT_FOUND',
  validationError: 'PLACE_VALIDATION_ERROR',
  createError: 'PLACE_CREATE_ERROR',
} as const;

type PlaceErrorValue = (typeof placeErrorCodes)[keyof typeof placeErrorCodes];

export type PlaceServiceError = PlaceErrorValue;
