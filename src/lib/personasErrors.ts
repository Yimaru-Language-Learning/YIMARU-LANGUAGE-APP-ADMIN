export function getPersonaApiErrorMessage(error: unknown, fallback: string): string {
  const data = (error as { response?: { data?: { message?: string; error?: string } } })
    ?.response?.data
  return data?.error ?? data?.message ?? fallback
}

export function isPersonaForbiddenError(error: unknown): boolean {
  return (error as { response?: { status?: number } })?.response?.status === 403
}

export const PERSONAS_FORBIDDEN_MESSAGE =
  "You don't have permission to access the persona catalog"
