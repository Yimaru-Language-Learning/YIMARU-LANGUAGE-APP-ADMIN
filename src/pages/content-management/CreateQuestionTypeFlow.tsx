import { useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
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
  validateDefinitionBasic,
  validateDefinitionKinds,
  validateDefinitionSchemas,
  type FieldErrorMap,
} from "./lib/questionTypeDefinitionValidation"
import { QuestionTypeBasicInfoStep } from "./components/question-type-steps/QuestionTypeBasicInfoStep"
import { QuestionTypeConfigStep } from "./components/question-type-steps/QuestionTypeConfigStep"
import { QuestionTypeValidatePreviewStep } from "./components/question-type-steps/QuestionTypeValidatePreviewStep"
import { QuestionTypeReviewPublishStep } from "./components/question-type-steps/QuestionTypeReviewPublishStep"

const initialDraft = (): QuestionTypeDefinitionCreatePayload => ({
  key: "",
  display_name: "",
  description: "",
  status: "ACTIVE",
  stimulus_component_kinds: [],
  response_component_kinds: [],
  stimulus_schema: [],
  response_schema: [],
})

function seedSchemaFromKinds(kinds: string[]) {
  return kinds.map((k, i) => ({
    id: `${(k || "field").toLowerCase().replace(/[^a-z0-9]+/g, "_") || "field"}_${i + 1}`,
    kind: k,
    label: k.replace(/_/g, " "),
    required: true as boolean,
  }))
}

function definitionToDraft(def: QuestionTypeDefinition): QuestionTypeDefinitionCreatePayload {
  return {
    key: def.key,
    display_name: def.display_name,
    description: def.description ?? "",
    status: def.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
    stimulus_component_kinds: [...(def.stimulus_component_kinds ?? [])],
    response_component_kinds: [...(def.response_component_kinds ?? [])],
    stimulus_schema: (def.stimulus_schema ?? []).map((r) => ({ ...r })),
    response_schema: (def.response_schema ?? []).map((r) => ({ ...r })),
  }
}

export function CreateQuestionTypeFlow() {
  const navigate = useNavigate()
  const { definitionId: definitionIdParam } = useParams<{ definitionId?: string }>()
  const editDefinitionId = useMemo(() => {
    if (!definitionIdParam || !/^\d+$/.test(definitionIdParam)) return null
    const n = Number(definitionIdParam)
    return Number.isFinite(n) && n > 0 ? n : null
  }, [definitionIdParam])
  const isEdit = editDefinitionId != null

  const [currentStep, setCurrentStep] = useState(1)
  const [draft, setDraft] = useState<QuestionTypeDefinitionCreatePayload>(initialDraft)
  const [versionName, setVersionName] = useState("Test 1")
  const [stepErrors, setStepErrors] = useState<FieldErrorMap>({})
  const [definitionReady, setDefinitionReady] = useState(!isEdit)

  const [componentCatalog, setComponentCatalog] = useState<QuestionComponentCatalog>({
    stimulus_component_kinds: [],
    response_component_kinds: [],
  })
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [catalogError, setCatalogError] = useState<string | null>(null)

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
          toast.error("Failed to load component catalog")
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
        setDraft(definitionToDraft(def))
        setVersionName("Test 1")
        setCurrentStep(1)
        setStepErrors({})
      } catch (e) {
        if (!cancelled) {
          console.error(e)
          toast.error("Failed to load definition")
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
      setDraft(initialDraft())
      setVersionName("Test 1")
      setCurrentStep(1)
      setStepErrors({})
      setDefinitionReady(true)
    }
  }, [isEdit])

  const catalogForSchemaValidation = {
    stimulus: new Set(componentCatalog.stimulus_component_kinds),
    response: new Set(componentCatalog.response_component_kinds),
  }

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
    const versionErr: FieldErrorMap = {}
    if (!versionName.trim()) {
      versionErr.version_name = "Version name is required."
    }
    const eKinds = validateDefinitionKinds(draft, componentCatalog)
    const mergedKinds = { ...versionErr, ...eKinds }
    setStepErrors(mergedKinds)
    if (Object.keys(mergedKinds).length) {
      toast.error("Complete version name and component selections.")
      return
    }

    const nextDraft: QuestionTypeDefinitionCreatePayload = { ...draft }
    if (!nextDraft.stimulus_schema.length && nextDraft.stimulus_component_kinds.length) {
      nextDraft.stimulus_schema = seedSchemaFromKinds(nextDraft.stimulus_component_kinds)
    }
    if (!nextDraft.response_schema.length && nextDraft.response_component_kinds.length) {
      nextDraft.response_schema = seedSchemaFromKinds(nextDraft.response_component_kinds)
    }
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

  const handleHeaderSaveDraft = async () => {
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
      const validation = await validateQuestionTypeDefinition(body)
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
      toast.error(String(err.response?.data?.message || "Save failed"), {
        description: err.response?.data?.error ? String(err.response.data.error) : undefined,
      })
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
            <Link
              to="/new-content/question-types"
              className="flex items-center gap-2 text-[15px] font-medium text-grayScale-600 transition-colors hover:text-brand-500 group"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back to Question Type Library
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-[28px] font-bold text-grayScale-900 tracking-tight">
                {isEdit ? "Edit question type definition" : "Create question type definition"}
              </h1>
              <p className="text-grayScale-500 text-[14px] font-medium max-w-2xl">
                {isEdit ? (
                  <>
                    Update definition{" "}
                    <code className="text-xs bg-grayScale-100 px-1 rounded">#{editDefinitionId}</code> via{" "}
                    <code className="text-xs bg-grayScale-100 px-1 rounded">PUT /questions/type-definitions/:id</code>
                    .
                  </>
                ) : (
                  <>
                    Build a reusable dynamic question type (schema + kinds) for{" "}
                    <code className="text-xs bg-grayScale-100 px-1 rounded">DYNAMIC</code> questions. Data is sent to{" "}
                    <code className="text-xs bg-grayScale-100 px-1 rounded">POST /questions/type-definitions</code>.
                  </>
                )}
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
                onClick={handleHeaderSaveDraft}
              >
                Save as Draft
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
          />
        )}
        {currentStep === 2 && (
          <QuestionTypeConfigStep
            draft={draft}
            setDraft={setDraft}
            versionName={versionName}
            setVersionName={setVersionName}
            stimulusCatalogKinds={componentCatalog.stimulus_component_kinds}
            responseCatalogKinds={componentCatalog.response_component_kinds}
            catalogLoading={catalogLoading}
            catalogError={catalogError}
            errors={stepErrors}
            onNext={handleNextFromStep2}
            onBack={handleBack}
          />
        )}
        {currentStep === 3 && (
          <QuestionTypeValidatePreviewStep draft={draft} onNext={() => setCurrentStep(4)} onBack={handleBack} />
        )}
        {currentStep === 4 && (
          <QuestionTypeReviewPublishStep draft={draft} onBack={handleBack} editDefinitionId={editDefinitionId} />
        )}
      </div>
    </div>
  )
}
