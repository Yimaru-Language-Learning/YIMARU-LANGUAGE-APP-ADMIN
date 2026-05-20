import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  getPracticesByParentCourse,
  getPracticesByParentModule,
  publishParentLinkedPractice,
  updateParentLinkedPractice,
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
  const [acting, setActing] = useState(false)
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

  const isDraftMode = allPublished

  const handlePublish = async () => {
    if (!Number.isFinite(parentId) || parentId < 1) return
    setActing(true)
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
      setActing(false)
    }
  }

  const handleSaveAsDraft = async () => {
    if (!Number.isFinite(parentId) || parentId < 1) return
    setActing(true)
    try {
      const res =
        parentKind === "COURSE"
          ? await getPracticesByParentCourse(parentId, { limit: 50, offset: 0 })
          : await getPracticesByParentModule(parentId, { limit: 50, offset: 0 })
      const toDraft = unwrapPracticesList(res).filter(isPracticePublished)
      if (toDraft.length === 0) {
        toast.info("No published practice to save as draft")
        await loadPractices()
        return
      }
      for (const practice of toDraft) {
        await updateParentLinkedPractice(practice.id, {
          publish_status: "DRAFT",
        })
      }
      toast.success(
        toDraft.length === 1
          ? "Practice saved as draft"
          : `${toDraft.length} practices saved as draft`,
      )
      await loadPractices()
      onPublished?.()
    } catch (e: unknown) {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Failed to save practice as draft"
      toast.error(msg)
    } finally {
      setActing(false)
    }
  }

  const disabled =
    loading ||
    acting ||
    !hasPractice ||
    (!hasDraft && !allPublished)

  let label = "Publish Practice"
  if (loading) label = "Loading…"
  else if (acting) label = isDraftMode ? "Saving…" : "Publishing…"
  else if (allPublished) label = "Save as Draft"

  const handleClick = () => {
    if (isDraftMode) {
      void handleSaveAsDraft()
      return
    }
    void handlePublish()
  }

  return (
    <Button
      type="button"
      className={cn(className)}
      disabled={disabled}
      onClick={handleClick}
      title={
        !hasPractice
          ? "No practice linked to this course yet"
          : allPublished
            ? "Move published practice back to draft"
            : hasDraft
              ? "Publish draft practice"
              : undefined
      }
    >
      {(loading || acting) && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {label}
    </Button>
  )
}
