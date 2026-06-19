import { getPractices } from "../api/courses.api"
import type { ParentContextPractice } from "../types/course.types"

const FETCH_PAGE_SIZE = 100

export async function fetchAllPractices(
  unlinkedOnly: boolean,
): Promise<ParentContextPractice[]> {
  const all: ParentContextPractice[] = []
  let offset = 0
  let totalCount = Number.POSITIVE_INFINITY

  while (offset < totalCount) {
    const res = await getPractices({
      limit: FETCH_PAGE_SIZE,
      offset,
      unlinked_only: unlinkedOnly,
    })
    const envelope = res.data?.data
    const batch = Array.isArray(envelope?.practices) ? envelope.practices : []
    if (typeof envelope?.total_count === "number") {
      totalCount = envelope.total_count
    } else if (batch.length === 0) {
      break
    } else {
      totalCount = offset + batch.length
    }
    all.push(...batch)
    if (batch.length === 0) break
    offset += FETCH_PAGE_SIZE
  }

  return all
}
