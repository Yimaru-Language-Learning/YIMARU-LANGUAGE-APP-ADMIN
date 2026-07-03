import { notifyApiError } from "../../lib/apiErrors"
import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { Loader2 } from "lucide-react"
import { PageBackLink } from "../../components/navigation/PageBackLink"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Card } from "../../components/ui/card"
import { Stepper } from "../../components/ui/stepper"
import {
  createQuestionTypeDefinition,
  validateQuestionTypeDefinition,
  extractDefinitionMutationId,
  getQuestionComponentCatalog,
  getQuestionTypeDefinitionById,
  updateQuestionTypeDefinition,
} from "../../api/questionTypeDefinitions.api"
import type {
  QuestionComponentCatalog,
  QuestionTypeDefinition,
  QuestionTypeDefinitionCreatePayload,
} from "../../types/questionTypeDefinition.types"
import {
  buildCreatePayload,
  buildValidateKindsPayload,
  seedSchemasFromKindsIfEmpty,
  validateDefinitionBasic,
  validateDefinitionKinds,
  validateDefinitionSchemas,
  validateDefinitionThroughStep,
  areDefinitionDraftsEqual,
  type FieldErrorMap,
} from "./lib/questionTypeDefinitionValidation"
import { defaultLabelForKind } from "../../lib/schemaSlotLabel"
import { QuestionTypeBasicInfoStep } from "./components/question-type-steps/QuestionTypeBasicInfoStep"
import { QuestionTypeConfigStep } from "./components/question-type-steps/QuestionTypeConfigStep"
import { QuestionTypeValidatePreviewStep } from "./components/question-type-steps/QuestionTypeValidatePreviewStep"
import { QuestionTypeReviewPublishStep } from "./components/question-type-steps/QuestionTypeReviewPublishStep"
import {
  mergeCatalogWithNoInput,
} from "../../lib/questionComponentKinds"

const initialDraft = (presetGroupId?: number | null): QuestionTypeDefinitionCreatePayload => ({
  key: "",
  display_name: "",
  description: "",
  group_ids: presetGroupId ? [presetGroupId] : null,
  status: "ACTIVE",
  stimulus_component_kinds: [],
  response_component_kinds: [],
  stimulus_schema: [],
  response_schema: [],
})

function definitionToDraft(def: QuestionTypeDefinition): QuestionTypeDefinitionCreatePayload {
  return {
    key: def.key,
    display_name: def.display_name,
    description: def.description ?? "",
    group_ids: def.group_ids ?? null,
    status: def.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    stimulus_component_kinds: [...(def.stimulus_component_kinds ?? [])],
    response_component_kinds: [...(def.response_component_kinds ?? [])],
    stimulus_schema: (def.stimulus_schema ?? []).map((r) => ({
      ...r,
      label: r.label?.trim() || defaultLabelForKind(r.kind),
    })),
    response_schema: (def.response_schema ?? []).map((r) => ({
      ...r,
      label: r.label?.trim() || defaultLabelForKind(r.kind),
    })),
  }
}

export function CreateQuestionTypeFlow() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetGroupId = useMemo(() => {
    const raw = searchParams.get("groupId")
    if (!raw || !/^\d+$/.test(raw)) return null
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [searchParams])
  const { definitionId: definitionIdParam } = useParams<{ definitionId?: string }>()
  const editDefinitionId = useMemo(() => {
    if (!definitionIdParam || !/^\d+$/.test(definitionIdParam)) return null
    const n = Number(definitionIdParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [definitionIdParam])
  const isEdit = editDefinitionId != null

  const [currentStep, setCurrentStep] = useState(1)
  const [draft, setDraft] = useState<QuestionTypeDefinitionCreatePayload>(() =>
    initialDraft(presetGroupId),
  )
  const [stepErrors, setStepErrors] = useState<FieldErrorMap>({})
  const [definitionReady, setDefinitionReady] = useState(!isEdit)
  const [isSystemDefinition, setIsSystemDefinition] = useState(false)

  const [componentCatalog, setComponentCatalog] = useState<QuestionComponentCatalog>({
    stimulus_component_kinds: [],
    response_component_kinds: [],
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedDraft, setSavedDraft] = useState<QuestionTypeDefinitionCreatePayload | null>(null)

  const hasUnsavedChanges = useMemo(() => {
    if (!isEdit || savedDraft == null) return false
    return !areDefinitionDraftsEqual(draft, savedDraft)
  }, [isEdit, draft, savedDraft])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setCatalogLoading(true)
      setCatalogError(null)
      try {
        const cat = await getQuestionComponentCatalog()
        if (!cancelled) {
          setComponentCatalog(cat)
          if (
            !cat.stimulus_component_kinds.length &&
            !cat.response_component_kinds.length
          ) {
            setCatalogError("Catalog returned no kinds — check API response shape.")
          }
        }
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          setCatalogError("Failed to load component catalog.")
          notifyApiError(e, "Failed to load component catalog")
        }
      } finally {
        if (!cancelled) setCatalogLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!isEdit || editDefinitionId == null) {
      setDefinitionReady(true)
      return
    }
    let cancelled = false
    setDefinitionReady(false)
    ;(async () => {
      try {
        const def = await getQuestionTypeDefinitionById(editDefinitionId)
        if (cancelled) return
        if (!def) {
          toast.error("Definition not found")
          navigate("/new-content/question-types")
          return
        }
        const loaded = definitionToDraft(def)
        setDraft(loaded)
        setSavedDraft(loaded)
        setIsSystemDefinition(Boolean(def.is_system))
        setCurrentStep(1)
        setStepErrors({})
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          notifyApiError(e, "Failed to load definition")
          navigate("/new-content/question-types")
        }
      } finally {
        if (!cancelled) setDefinitionReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, editDefinitionId, navigate])

  useEffect(() => {
    if (!isEdit) {
      setDraft(initialDraft(presetGroupId))
      setSavedDraft(null)
      setCurrentStep(1)
      setStepErrors({})
      setDefinitionReady(true)
    }
  }, [isEdit, presetGroupId])

  const catalogForSchemaValidation = {
    stimulus: new Set(mergeCatalogWithNoInput(componentCatalog.stimulus_component_kinds)),
    response: new Set(mergeCatalogWithNoInput(componentCatalog.response_component_kinds)),
  }

  const stimulusCatalogKinds = useMemo(
    () => mergeCatalogWithNoInput(componentCatalog.stimulus_component_kinds),
    [componentCatalog.stimulus_component_kinds],
  )
  const responseCatalogKinds = useMemo(
    () => mergeCatalogWithNoInput(componentCatalog.response_component_kinds),
    [componentCatalog.response_component_kinds],
  )

  const handleNextFromStep1 = () => {
    const e1 = validateDefinitionBasic(draft)
    setStepErrors(e1)
    if (Object.keys(e1).length) {
      toast.error("Fix the highlighted fields before continuing.")
      return
    }
    setStepErrors({})
    setCurrentStep(2)
  }

  const handleNextFromStep2 = () => {
    const eKinds = validateDefinitionKinds(draft, componentCatalog)
    setStepErrors(eKinds)
    if (Object.keys(eKinds).length) {
      toast.error("Select valid stimulus and response component kinds.")
      return
    }

    const nextDraft = seedSchemasFromKindsIfEmpty(draft)
    setDraft(nextDraft)

    const mergedSchema = validateDefinitionSchemas(nextDraft, catalogForSchemaValidation)
    setStepErrors(mergedSchema)
    if (Object.keys(mergedSchema).length) {
      toast.error("Fix schema issues (expand Advanced) or adjust selected kinds.", {
        description: "Open “Advanced: edit schema rows” to fix row ids and kinds.",
      })
      return
    }
    setStepErrors({})
    setCurrentStep(3)
  }

  const handleBack = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleSaveEdit = async () => {
    if (!isEdit || editDefinitionId == null || !hasUnsavedChanges) return

    const prepared = currentStep >= 2 ? seedSchemasFromKindsIfEmpty(draft) : draft

    const errors = validateDefinitionThroughStep(
      currentStep,
      prepared,
      componentCatalog,
      catalogForSchemaValidation,
    )
    setStepErrors(errors)
    if (Object.keys(errors).length) {
      toast.error("Fix the highlighted fields before saving.")
      return
    }
    setStepErrors({})

    const body = buildCreatePayload(prepared)
    setSaving(true)
    try {
      if (currentStep >= 2) {
        const validation = await validateQuestionTypeDefinition(buildValidateKindsPayload(prepared))
        if (!validation.valid) {
          toast.error(validation.message || "Invalid question type definition", {
            description: validation.error ? String(validation.error) : undefined,
          })
          return
        }
      }

      const res = await updateQuestionTypeDefinition(editDefinitionId, body)
      const id = extractDefinitionMutationId(res) ?? editDefinitionId
      toast.success(res.data?.message || "Question type definition updated", {
        description: `Definition id: ${id}`,
      })
      navigate(`/new-content/question-types?updated=${id}`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } }
      notifyApiError(err, "Save failed")
    } finally {
      setSaving(false)
    }
  }

  const handleHeaderSaveDraft = async () => {
    if (isEdit) {
      await handleSaveEdit()
      return
    }
    setDraft((d) => ({ ...d, status: "INACTIVE" }))
    if (currentStep < 4) {
      toast.message("Status set to Inactive", {
        description: "Complete the wizard; on the last step you can save the definition to the server.",
      })
      return
    }
    const body = { ...buildCreatePayload({ ...draft, status: "INACTIVE" }), status: "INACTIVE" as const }
    try {
      if (isEdit && editDefinitionId != null) {
        const res = await updateQuestionTypeDefinition(editDefinitionId, body)
        const id = extractDefinitionMutationId(res) ?? editDefinitionId
        toast.success(res.data?.message || "Definition saved as draft", {
          description: `Definition id: ${id}`,
        })
        navigate(`/new-content/question-types?updated=${id}`)
        return
      }
      const validation = await validateQuestionTypeDefinition(buildValidateKindsPayload(body))
      if (!validation.valid) {
        toast.error(validation.message || "Invalid question type definition", {
          description: validation.error ? String(validation.error) : undefined,
        })
        return
      }
      const res = await createQuestionTypeDefinition(body)
      const id = extractDefinitionMutationId(res)
      if (id == null) {
        toast.error(res.data?.message ?? "Save failed: missing definition id in response.")
        return
      }
      toast.success(res.data?.message || "Definition saved as draft", {
        description: `Definition id: ${id}`,
      })
      navigate(`/new-content/question-types?created=${id}`)
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string; error?: string } } }
      notifyApiError(err, "Save failed")
    }
  }

  const steps = ["Basic Info", "Input & answer types", "Validate", "Review & publish"]

  if (isEdit && !definitionReady) {
    return (
      <div className="min-h-screen pb-20 flex items-center justify-center px-6">
        <Card className="p-10 max-w-md w-full text-center border-grayScale-200">
          <p className="text-grayScale-600 font-medium">Loading definition…</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-20 overflow-x-hidden">
      <div className=" border-b border-grayScale-100 sticky top-0 z-50 bg-white/95 backdrop-blur">
        <div className="max-w-[1440px] mx-auto py-6 px-4 sm:px-6">
          <div className="flex items-center justify-between mb-8">
            <PageBackLink
              fallbackTo="/new-content/question-types"
              label="Back to Question Type Library"
              iconClassName="h-5 w-5 group-hover:-translate-x-1"
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-[28px] font-bold text-grayScale-900 tracking-tight">
                {isEdit ? "Edit question type definition" : "Create question type definition"}
              </h1>
              <p className="text-grayScale-500 text-[14px] font-medium max-w-2xl">
                {isEdit
                  ? `Update reusable question type definition #${editDefinitionId}.`
                  : "Build a reusable question type template for dynamic practice and assessment questions."}
              </p>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <Button
                variant="outline"
                className="h-10 px-8 rounded-[6px] border-grayScale-200 text-grayScale-900 font-medium hover:bg-grayScale-50"
                onClick={() => navigate("/new-content/question-types")}
              >
                Cancel
              </Button>
              <Button
                className="h-10 px-8 rounded-[6px] bg-[#9E2891] font-medium text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all"
                onClick={() => void handleHeaderSaveDraft()}
                disabled={saving || (isEdit && !hasUnsavedChanges)}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving…
                  </>
                ) : isEdit ? (
                  "Save changes"
                ) : (
                  "Save as Draft"
                )}
              </Button>
            </div>
          </div>

          <div className="mt-12 mx-auto">
            <Stepper steps={steps} currentStep={currentStep} />
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-10 mt-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {currentStep === 1 && (
          <QuestionTypeBasicInfoStep
            draft={draft}
            setDraft={setDraft}
            errors={stepErrors}
            keyReadOnly={isEdit}
            onNext={handleNextFromStep1}
            saving={saving}
          />
        )}
        {currentStep === 2 && (
          <QuestionTypeConfigStep
            draft={draft}
            setDraft={setDraft}
            stimulusCatalogKinds={stimulusCatalogKinds}
            responseCatalogKinds={responseCatalogKinds}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            errors={stepErrors}
            onNext={handleNextFromStep2}
            onBack={handleBack}
            saving={saving}
          />
        )}
        {currentStep === 3 && (
          <QuestionTypeValidatePreviewStep
            draft={draft}
            onNext={() => setCurrentStep(4)}
            onBack={handleBack}
            saving={saving}
          />
        )}
        {currentStep === 4 && (
          <QuestionTypeReviewPublishStep
            draft={draft}
            onBack={handleBack}
            editDefinitionId={editDefinitionId}
            isSystem={isSystemDefinition}
            saveDisabled={isEdit && !hasUnsavedChanges}
          />
        )}
      </div>
    </div>
  )
}
