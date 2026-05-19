import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  getPracticesByParentCourse,
  getPracticesByParentModule,
  publishParentLinkedPractice,
} from "../../../api/courses.api"
import type { PracticeParentKind } from "../../../types/course.types"
import { Button } from "../../../components/ui/button"
import { cn } from "../../../lib/utils"
import {
  draftPracticesForParent,
  isPracticePublished,
  unwrapPracticesList,
} from "../../../lib/parentContextPractice"

type Props = {
  parentKind: Extract<PracticeParentKind, "COURSE" | "MODULE">
  parentId: number
  className?: string
  onPublished?: () => void
}

export function PublishPracticeButton({
  parentKind,
  parentId,
  className,
  onPublished,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)
  const [allPublished, setAllPublished] = useState(false)
  const [hasPractice, setHasPractice] = useState(false)

  const loadPractices = useCallback(async () => {
    if (!Number.isFinite(parentId) || parentId < 1) {
      setHasPractice(false)
      setHasDraft(false)
      setAllPublished(false)
      setLoading(false)
      return
    }
    setLoading(true)
    try {
      const res =
        parentKind === "COURSE"
          ? await getPracticesByParentCourse(parentId, { limit: 50, offset: 0 })
          : await getPracticesByParentModule(parentId, { limit: 50, offset: 0 })
      const list = unwrapPracticesList(res)
      const drafts = draftPracticesForParent(list)
      setHasPractice(list.length > 0)
      setHasDraft(drafts.length > 0)
      setAllPublished(
        list.length > 0 && list.every((p) => isPracticePublished(p)),
      )
    } catch {
      setHasPractice(false)
      setHasDraft(false)
      setAllPublished(false)
    } finally {
      setLoading(false)
    }
  }, [parentKind, parentId])

  useEffect(() => {
    void loadPractices()
  }, [loadPractices])

  const handlePublish = async () => {
    if (!Number.isFinite(parentId) || parentId < 1) return
    setPublishing(true)
    try {
      const res =
        parentKind === "COURSE"
          ? await getPracticesByParentCourse(parentId, { limit: 50, offset: 0 })
          : await getPracticesByParentModule(parentId, { limit: 50, offset: 0 })
      const drafts = draftPracticesForParent(unwrapPracticesList(res))
      if (drafts.length === 0) {
        toast.info("No draft practice to publish")
        await loadPractices()
        return
      }
      for (const practice of drafts) {
        await publishParentLinkedPractice(practice.id)
      }
      toast.success(
        drafts.length === 1
          ? "Practice published"
          : `${drafts.length} practices published`,
      )
      await loadPractices()
      onPublished?.()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to publish practice"
      toast.error(msg)
    } finally {
      setPublishing(false)
    }
  }

  const disabled =
    loading || publishing || !hasPractice || !hasDraft || allPublished

  let label = "Publish Practice"
  if (loading) label = "Loading…"
  else if (publishing) label = "Publishing…"
  else if (!hasPractice) label = "No practice"
  else if (allPublished) label = "Published"

  return (
    <Button
      type="button"
      className={cn(className)}
      disabled={disabled}
      onClick={() => void handlePublish()}
      title={
        allPublished
          ? "Practice is already published"
          : !hasPractice
            ? "No practice linked to this item yet"
            : undefined
      }
    >
      {(loading || publishing) && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {label}
    </Button>
  )
}
