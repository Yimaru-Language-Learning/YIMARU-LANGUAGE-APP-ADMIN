export const ANALYTICS_POLL_INTERVAL_MS = 20_000
const MAX_RETRY_INTERVAL_MS = 120_000

/** Keep successful polls on 20-second start slots, skipping any missed slots.
 * Failures instead back off from completion so a slow failure cannot retry
 * immediately. The caller schedules only after the current request settles.
 */
export function getAnalyticsPollDelay(startedAt: number, completedAt: number, failures: number): number {
  if (failures > 0) {
    return Math.min(ANALYTICS_POLL_INTERVAL_MS * 2 ** Math.min(failures, 3), MAX_RETRY_INTERVAL_MS)
  }
  const elapsed = Math.max(0, completedAt - startedAt)
  return ANALYTICS_POLL_INTERVAL_MS - elapsed % ANALYTICS_POLL_INTERVAL_MS
}
