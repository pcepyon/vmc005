export const reviewErrorCodes = {
  fetchError: 'REVIEW_FETCH_ERROR',
  validationError: 'REVIEW_VALIDATION_ERROR',
  placeNotFound: 'REVIEW_PLACE_NOT_FOUND',
  createError: 'REVIEW_CREATE_ERROR',
} as const;

type ReviewErrorValue = (typeof reviewErrorCodes)[keyof typeof reviewErrorCodes];

export type ReviewServiceError = ReviewErrorValue;
