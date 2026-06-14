export function getFaqApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data
  return data?.error ?? data?.message ?? fallback
}

export function isFaqForbiddenError(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403
}

export const FAQ_FORBIDDEN_MESSAGE =
  "You don't have permission to access this resource"
