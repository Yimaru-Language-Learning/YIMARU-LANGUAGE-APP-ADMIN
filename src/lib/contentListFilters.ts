import type { PracticePublishStatus } from "../types/course.types"
import { normalizePublishStatus } from "./publishStatus"

export type PublishStatusFilter = "all" | PracticePublishStatus

export function textMatchesSearch(
  query: string,
  ...fields: (string | null | undefined)[]
): boolean {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return fields.some((field) => (field ?? "").toLowerCase().includes(needle))
}

export function matchesPublishStatusFilter(
  publishStatus: string | null | undefined,
  filter: PublishStatusFilter,
): boolean {
  if (filter === "all") return true
  return normalizePublishStatus(publishStatus) === filter
}

export function hasActiveContentFilters(
  search: string,
  publishStatusFilter: PublishStatusFilter,
): boolean {
  return Boolean(search.trim()) || publishStatusFilter !== "all"
}

export function filterBySearchAndPublishStatus<T>(
  items: T[],
  options: {
    search: string
    publishStatusFilter: PublishStatusFilter
    getSearchFields: (item: T) => (string | null | undefined)[]
    getPublishStatus: (item: T) => string | null | undefined
  },
): T[] {
  const { search, publishStatusFilter, getSearchFields, getPublishStatus } =
    options
  return items.filter((item) => {
    if (
      !matchesPublishStatusFilter(getPublishStatus(item), publishStatusFilter)
    ) {
      return false
    }
    return textMatchesSearch(search, ...getSearchFields(item))
  })
}
