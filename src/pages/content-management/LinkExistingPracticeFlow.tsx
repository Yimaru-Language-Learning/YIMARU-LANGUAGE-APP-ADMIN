import { notifyApiError } from "../../lib/apiErrors"
import { useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Link2 } from "lucide-react"
import { PageBackLink } from "../../components/navigation/PageBackLink"
import { navigateBack } from "../../lib/navigateBack"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Stepper } from "../../components/ui/stepper"
import successIcon from "../../assets/success.svg"
import type { ParentContextPractice, PracticeParentKind } from "../../types/course.types"
import { attachPracticeToParent } from "../../lib/attachPracticeToParent"
import { formatPracticeParentLabel } from "../../lib/practiceParents"
import type { PracticeParentTitleHints } from "../../lib/practiceParentTitles"
import { LinkExistingPracticeReviewStep } from "./components/practice-steps/LinkExistingPracticeReviewStep"
import { SelectPracticeToAttachStep } from "./components/practice-steps/SelectPracticeToAttachStep"

const STEP_LABELS = ["Select practice", "Review"] as const

export function LinkExistingPracticeFlow() {
  const navigate = useNavigate()
  const {
    level,
    programType,
    courseId: routeCourseId,
    unitId: routeUnitId,
    moduleId: routeModuleId,
  } = useParams<{
    level?: string
    programType?: string
    courseId?: string
    unitId?: string
    moduleId?: string
  }>()
  const [searchParams] = useSearchParams()
  const backToParam = searchParams.get("backTo")
  const lessonId = searchParams.get("lessonId")
  const lessonTitleRaw = searchParams.get("lessonTitle")

  const isExamPrep = Boolean(programType?.trim())

  const effectiveBackTo = useMemo(() => {
    if (backToParam?.trim()) return backToParam.trim()
    if (isExamPrep && routeModuleId) return "module"
    if (isExamPrep && routeUnitId && !routeModuleId) return "unit"
    if (isExamPrep && routeCourseId) return "courses"
    return null
  }, [backToParam, isExamPrep, routeModuleId, routeUnitId, routeCourseId])

  const courseId = isExamPrep
    ? routeCourseId ?? searchParams.get("courseId")
    : searchParams.get("courseId")
  const moduleId = isExamPrep
    ? routeModuleId ?? searchParams.get("moduleId")
    : searchParams.get("moduleId")
  const unitId = isExamPrep ? routeUnitId : null

  const lessonTitleDisplay = (() => {
    const raw = lessonTitleRaw?.trim()
    if (!raw) return null
    try {
      return decodeURIComponent(raw)
    } catch {
      return raw
    }
  })()

  const isModuleContext = effectiveBackTo === "module"
  const isUnitContext = effectiveBackTo === "unit"
  const isCourseContext =
    effectiveBackTo === "modules" || effectiveBackTo === "courses"

  const parentContext = useMemo((): {
    kind: PracticeParentKind
    id: number
  } | null => {
    const lid = lessonId ? Number(lessonId) : NaN
    if (Number.isFinite(lid) && lid > 0) return { kind: "LESSON", id: lid }
    const mid = moduleId ? Number(moduleId) : NaN
    if (isModuleContext && !isExamPrep && Number.isFinite(mid) && mid > 0)
      return { kind: "MODULE", id: mid }
    const uid = unitId ? Number(unitId) : NaN
    if (isUnitContext && isExamPrep && Number.isFinite(uid) && uid > 0)
      return { kind: "UNIT", id: uid }
    const cid = courseId ? Number(courseId) : NaN
    if (isCourseContext && Number.isFinite(cid) && cid > 0) {
      return { kind: isExamPrep ? "CATALOG_COURSE" : "COURSE", id: cid }
    }
    if (isExamPrep && !courseId && !moduleId && !lessonId && programType) {
      return null
    }
    return null
  }, [lessonId, moduleId, unitId, courseId, isModuleContext, isUnitContext, isCourseContext, isExamPrep, programType])

  const targetParent = useMemo(
    () =>
      parentContext
        ? { parent_kind: parentContext.kind, parent_id: parentContext.id }
        : null,
    [parentContext],
  )

  const targetSummary = useMemo(() => {
    if (targetParent) return formatPracticeParentLabel(targetParent)
    if (lessonId)
      return `Lesson #${lessonId}${lessonTitleDisplay ? ` — ${lessonTitleDisplay}` : ""}`
    if (isModuleContext && moduleId) return `Module #${moduleId}`
    if (isUnitContext && unitId) return `Unit #${unitId}`
    if (isCourseContext && courseId) return `Course #${courseId}`
    return "selected content"
  }, [
    targetParent,
    lessonId,
    lessonTitleDisplay,
    isModuleContext,
    isUnitContext,
    isCourseContext,
    moduleId,
    unitId,
    courseId,
  ])

  const backLabel =
    effectiveBackTo === "lesson"
      ? "Back to Lessons"
      : effectiveBackTo === "module"
        ? "Back to Module"
        : effectiveBackTo === "unit"
          ? "Back to Unit"
          : effectiveBackTo === "modules"
            ? "Back to Modules"
            : effectiveBackTo === "courses"
              ? "Back to Course"
              : isExamPrep
                ? "Back to Program"
                : "Back to Courses"

  const backPath = useMemo(() => {
    if (isExamPrep) {
      if (
        effectiveBackTo === "module" &&
        programType &&
        courseId &&
        unitId &&
        moduleId
      ) {
        return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}`
      }
      if (effectiveBackTo === "unit" && programType && courseId && unitId) {
        return `/new-content/courses/${programType}/${courseId}/${unitId}`
      }
      if (effectiveBackTo === "courses" && programType && courseId) {
        return `/new-content/courses/${programType}/${courseId}`
      }
      if (
        effectiveBackTo === "lesson" &&
        programType &&
        courseId &&
        unitId &&
        moduleId &&
        lessonId
      ) {
        const titleQuery = lessonTitleRaw?.trim()
          ? `?lessonTitle=${encodeURIComponent(lessonTitleDisplay || lessonTitleRaw)}`
          : ""
        return `/new-content/courses/${programType}/${courseId}/${unitId}/${moduleId}/lessons/${lessonId}/practices${titleQuery}`
      }
      if (programType) {
        return `/new-content/courses/${programType}`
      }
      return "/new-content"
    }
    if (
      effectiveBackTo === "lesson" &&
      level &&
      courseId &&
      moduleId &&
      lessonId
    ) {
      const titleQuery = lessonTitleRaw?.trim()
        ? `?lessonTitle=${encodeURIComponent(lessonTitleDisplay || lessonTitleRaw)}`
        : ""
      return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}/lessons/${lessonId}/practices${titleQuery}`
    }
    if (effectiveBackTo === "module" && level && courseId && moduleId) {
      return `/new-content/learn-english/${level}/courses/${courseId}/modules/${moduleId}`
    }
    if (effectiveBackTo === "modules" && level && courseId) {
      return `/new-content/learn-english/${level}/courses/${courseId}`
    }
    return `/new-content/learn-english/${level}/courses`
  }, [
    isExamPrep,
    effectiveBackTo,
    programType,
    courseId,
    unitId,
    moduleId,
    lessonId,
    lessonTitleRaw,
    lessonTitleDisplay,
    level,
  ])

  const goBack = () => navigateBack(navigate, backPath)

  const parentTitleHints = useMemo((): PracticeParentTitleHints => {
    const hints: PracticeParentTitleHints = {}
    const lid = lessonId ? Number(lessonId) : NaN
    if (Number.isFinite(lid) && lid > 0 && lessonTitleDisplay?.trim()) {
      hints.lessons = { [lid]: lessonTitleDisplay.trim() }
    }
    return hints
  }, [lessonId, lessonTitleDisplay])

  const [currentStep, setCurrentStep] = useState(1)
  const [isComplete, setIsComplete] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPractice, setSelectedPractice] = useState<ParentContextPractice | null>(
    null,
  )

  if (!parentContext || !targetParent) {
    return (
      <div className="space-y-8 px-6 pb-16 pt-6">
        <div className="mx-auto max-w-lg py-16 text-center">
          <h1 className="text-2xl font-bold text-grayScale-900">Missing content context</h1>
          <p className="mt-2 text-sm text-grayScale-600">
            Open attach practice from a course, module, or lesson so the API knows where to link
            the practice.
          </p>
          <Button
            className="mt-6 rounded-[6px]"
            variant="outline"
            onClick={goBack}
          >
            {backLabel}
          </Button>
        </div>
      </div>
    )
  }

  const submitAttach = async () => {
    if (!selectedPractice) return
    setSubmitting(true)
    try {
      await attachPracticeToParent(selectedPractice, targetParent, { isExamPrep })
      toast.success("Practice linked successfully")
      setIsComplete(true)
    } catch (e) {
      notifyApiError(e, "Could not link practice")
    } finally {
      setSubmitting(false)
    }
  }

  if (isComplete) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 pb-20 text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-10">
          <div className="absolute inset-0 rounded-full bg-brand-500/10 blur-3xl" />
          <img src={successIcon} alt="" className="relative h-28 w-28" />
        </div>
        <h1 className="mb-2 text-[28px] font-bold text-grayScale-900">
          Practice linked successfully
        </h1>
        <p className="mb-14 max-w-lg text-base font-medium leading-relaxed text-grayScale-600">
          <span className="font-semibold text-grayScale-900">
            {selectedPractice?.title?.trim() || `Practice #${selectedPractice?.id}`}
          </span>{" "}
          is now attached to {targetSummary}.
        </p>
        <Button
          onClick={goBack}
          className="h-14 rounded-[6px] bg-brand-500 px-10 text-[16px] font-bold text-white shadow-xl shadow-brand-500/20"
        >
          {backLabel}
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-0 pb-12 pt-2 sm:space-y-8 sm:px-2 sm:pb-16 sm:pt-4">
      <div className="mx-auto w-full max-w-7xl min-w-0">
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <PageBackLink fallbackTo={backPath} label={backLabel} />
        </div>

        <div className="mb-8 sm:mb-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <h1 className="text-2xl font-bold text-[#0F172A] sm:text-3xl">Attach Existing Practice</h1>
            <Button
              variant="outline"
              className="h-10 w-full rounded-[6px] border-grayScale-200 bg-white px-6 font-bold text-grayScale-600 hover:bg-grayScale-50 sm:w-auto"
              onClick={goBack}
            >
              Cancel
            </Button>
          </div>
          <p className="mt-1 text-sm text-grayScale-400 sm:text-base">
            Browse your practice library and link an existing practice to this content location.
          </p>
          <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50/80 px-4 py-3 text-sm text-violet-950">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-700">
                <Link2 className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold text-violet-900">Attach to</p>
                <p className="mt-1 text-violet-800/90">
                  <span className="font-medium">{targetSummary}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto mb-8 w-full max-w-3xl sm:mb-12">
          <Stepper steps={[...STEP_LABELS]} currentStep={currentStep} />
        </div>

        <div className="mx-auto min-w-0 max-w-4xl">
          {currentStep === 1 ? (
            <SelectPracticeToAttachStep
              isExamPrep={isExamPrep}
              targetParent={targetParent}
              targetSummary={targetSummary}
              selectedPracticeId={selectedPractice?.id ?? null}
              onSelect={setSelectedPractice}
              nextStep={() => setCurrentStep(2)}
              onCancel={goBack}
            />
          ) : selectedPractice ? (
            <LinkExistingPracticeReviewStep
              practice={selectedPractice}
              targetParent={targetParent}
              targetSummary={targetSummary}
              titleHints={parentTitleHints}
              saving={submitting}
              onBack={() => setCurrentStep(1)}
              onConfirm={() => void submitAttach()}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
