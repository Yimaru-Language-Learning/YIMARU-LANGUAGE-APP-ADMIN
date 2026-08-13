export type OffsetPageResult<T> = {
  items: T[]
  total_count?: number
}

const DEFAULT_BATCH_SIZE = 100

/** Unwrap `{ data: { <key>: T[], total_count } }` list envelopes used by LMS/exam-prep APIs. */
export function offsetPageFromListEnvelope<T>(
  res: { data?: { data?: unknown; Data?: unknown } },
  key: string,
): OffsetPageResult<T> {
  const body = res.data?.data ?? res.data?.Data
  if (!body || typeof body !== "object") return { items: [] }
  const record = body as Record<string, unknown>
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1)
  const raw = record[key] ?? record[pascalKey]
  const items = Array.isArray(raw) ? (raw as T[]) : []
  const total = Number(record.total_count ?? record.TotalCount ?? record.totalCount)
  return {
    items,
    total_count: Number.isFinite(total) && total >= 0 ? total : undefined,
  }
}

/**
 * Fetches every page from an offset/limit API so client-side search can run across the full dataset.
 */
export async function fetchAllOffsetPages<T>(
  fetchPage: (offset: number, limit: number) => Promise<OffsetPageResult<T>>,
  batchSize = DEFAULT_BATCH_SIZE,
): Promise<T[]> {
  const all: T[] = []
  let offset = 0
  let totalCount = Number.POSITIVE_INFINITY

  while (offset < totalCount) {
    const { items, total_count } = await fetchPage(offset, batchSize)
    all.push(...items)

    if (typeof total_count === "number" && Number.isFinite(total_count)) {
      totalCount = total_count
    } else if (items.length === 0) {
      break
    } else if (items.length < batchSize) {
      break
    }

    if (items.length === 0) break
    offset += items.length
  }

  return all
}
