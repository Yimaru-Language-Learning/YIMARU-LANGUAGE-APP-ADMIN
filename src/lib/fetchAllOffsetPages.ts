export type OffsetPageResult<T> = {
  items: T[]
  total_count?: number
}

const DEFAULT_BATCH_SIZE = 100

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
