import { useEffect, useMemo, useState } from "react"
import type { PracticeParent } from "../types/course.types"
import { dedupeParents } from "../lib/practiceParents"
import {
  resolvePracticeParentTitles,
  type PracticeParentTitleHints,
  type PracticeParentTitleMap,
} from "../lib/practiceParentTitles"

export function usePracticeParentTitles(
  parents: PracticeParent[],
  hints?: PracticeParentTitleHints,
) {
  const [titles, setTitles] = useState<PracticeParentTitleMap>(() => new Map())
  const [loading, setLoading] = useState(true)

  const parentsKey = useMemo(
    () =>
      dedupeParents(parents)
        .map((parent) => `${parent.parent_kind}:${parent.parent_id}`)
        .sort()
        .join("|"),
    [parents],
  )

  const hintsKey = useMemo(
    () =>
      JSON.stringify({
        courses: hints?.courses ?? {},
        modules: hints?.modules ?? {},
        lessons: hints?.lessons ?? {},
      }),
    [hints?.courses, hints?.modules, hints?.lessons],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void resolvePracticeParentTitles(parents, hints).then((resolved) => {
      if (!cancelled) {
        setTitles(resolved)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [parentsKey, hintsKey])

  return { titles, loading }
}
