import { useCallback, useEffect, useMemo, useState } from "react"
import type { ParentContextPractice } from "../types/course.types"

export function usePracticeListSelection(
  visiblePractices: ParentContextPractice[],
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())

  const visibleIds = useMemo(
    () => new Set(visiblePractices.map((practice) => practice.id)),
    [visiblePractices],
  )

  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(
        [...prev].filter((id) => visibleIds.has(id)),
      )
      return next.size === prev.size ? prev : next
    })
  }, [visibleIds])

  const selectedPractices = useMemo(
    () => visiblePractices.filter((practice) => selectedIds.has(practice.id)),
    [visiblePractices, selectedIds],
  )

  const allSelected =
    visiblePractices.length > 0 &&
    visiblePractices.every((practice) => selectedIds.has(practice.id))

  const isSelected = useCallback(
    (practiceId: number) => selectedIds.has(practiceId),
    [selectedIds],
  )

  const toggle = useCallback((practiceId: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(practiceId)) {
        next.delete(practiceId)
      } else {
        next.add(practiceId)
      }
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (
        visiblePractices.length > 0 &&
        visiblePractices.every((practice) => prev.has(practice.id))
      ) {
        return new Set()
      }
      return new Set(visiblePractices.map((practice) => practice.id))
    })
  }, [visiblePractices])

  const clear = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectedPractices,
    allSelected,
    isSelected,
    toggle,
    toggleAll,
    clear,
  }
}
