export function getRatingsApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data
  return data?.error ?? data?.message ?? fallback
}

export function isRatingsForbiddenError(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403
}

export const RATINGS_FORBIDDEN_MESSAGE =
  "You don't have permission to access ratings and app reviews"
