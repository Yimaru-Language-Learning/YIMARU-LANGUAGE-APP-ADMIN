import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { getFAQById, getFAQs, updateFAQ } from "../../api/faq.api"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { useFaqPermissions } from "../../hooks/useFaqPermissions"
import { deriveFaqCategories } from "../../lib/faqDisplay"
import { getFaqApiErrorMessage, isFaqForbiddenError } from "../../lib/faqErrors"
import type { FAQ, FAQStatus } from "../../types/faq.types"
import { FaqAccessDenied } from "./components/FaqAccessDenied"
import {
  draftToUpdatePayload,
  FaqForm,
  validateFaqDraft,
  type FaqFormDraft,
} from "./components/FaqForm"

function faqToDraft(faq: FAQ): FaqFormDraft {
  return {
    question: faq.question,
    answer: faq.answer,
    category: faq.category ?? "",
    display_order: String(faq.display_order ?? 0),
  }
}

export function EditFaqPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const faqId = Number(id)
  const { canGet, canUpdate, loading: permissionsLoading } = useFaqPermissions()

  const [loading, setLoading] = useState(true)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingAction, setSavingAction] = useState<"draft" | "publish" | null>(null)
  const [draft, setDraft] = useState<FaqFormDraft | null>(null)
  const [currentStatus, setCurrentStatus] = useState<FAQStatus>("INACTIVE")
  const [categories, setCategories] = useState<string[]>([])

  const load = useCallback(async () => {
    if (!Number.isFinite(faqId) || faqId <= 0) {
      toast.error("Invalid FAQ ID")
      navigate("/help/faqs", { replace: true })
      return
    }

    if (!canGet) {
      setLoading(false)
      return
    }

    setLoading(true)
    setPermissionDenied(false)
    try {
      const [faqRes, listRes] = await Promise.all([
        getFAQById(faqId),
        getFAQs({ limit: 200, offset: 0 }),
      ])

      if (!faqRes.data) {
        toast.error("FAQ not found")
        navigate("/help/faqs", { replace: true })
        return
      }

      setDraft(faqToDraft(faqRes.data))
      setCurrentStatus(faqRes.data.status)
      setCategories(deriveFaqCategories(listRes.data.faqs))
    } catch (e: unknown) {
      console.error(e)
      const status = (e as { response?: { status?: number } })?.response?.status
      if (status === 404) {
        toast.error("FAQ not found")
        navigate("/help/faqs", { replace: true })
        return
      }
      if (isFaqForbiddenError(e)) {
        setPermissionDenied(true)
        toast.error(getFaqApiErrorMessage(e, "You do not have permission to view this FAQ"))
        return
      }
      toast.error(getFaqApiErrorMessage(e, "Failed to load FAQ"))
    } finally {
      setLoading(false)
    }
  }, [faqId, canGet, navigate])

  useEffect(() => {
    void load()
  }, [load])

  const handleSave = async (status: FAQStatus) => {
    if (!draft) return
    if (!canUpdate) {
      toast.error("You do not have permission to update FAQs")
      return
    }

    const validationError = validateFaqDraft(draft)
    if (validationError) {
      toast.error(validationError)
      return
    }

    setSaving(true)
    setSavingAction(status === "ACTIVE" ? "publish" : "draft")
    try {
      const response = await updateFAQ(faqId, draftToUpdatePayload(draft, status))
      if (!response.data) {
        throw new Error("Empty update response")
      }
      setDraft(faqToDraft(response.data))
      setCurrentStatus(response.data.status)
      toast.success(
        status === "ACTIVE"
          ? response.message ?? "FAQ published successfully"
          : response.message ?? "FAQ saved as draft",
      )
    } catch (e: unknown) {
      console.error(e)
      toast.error(getFaqApiErrorMessage(e, "Failed to update FAQ"))
    } finally {
      setSaving(false)
      setSavingAction(null)
    }
  }

  if (!permissionsLoading && !canGet) {
    return <FaqAccessDenied />
  }

  if (!permissionsLoading && permissionDenied) {
    return <FaqAccessDenied apiForbidden />
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pb-12">
      <Link
        to="/help/faqs"
        className="group flex w-fit items-center gap-2 text-sm font-semibold text-grayScale-600 transition-colors hover:text-brand-500"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to FAQs
      </Link>

      <div className="space-y-2">
        <p className="text-sm font-semibold text-grayScale-500">Help center</p>
        <h1 className="text-2xl font-semibold tracking-tight text-grayScale-900">
          Edit FAQ
        </h1>
        <p className="max-w-2xl text-sm text-grayScale-500">
          Update question, answer, category, or display order. Save as draft or publish when ready.
        </p>
      </div>

      <Card className="border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-100 pb-4">
          <CardTitle className="text-lg">FAQ details</CardTitle>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          {loading || !draft ? (
            <div className="flex justify-center py-8">
              <SpinnerIcon className="h-6 w-6" />
            </div>
          ) : (
            <FaqForm
              draft={draft}
              saving={saving}
              savingAction={savingAction}
              categories={categories}
              currentStatus={currentStatus}
              onChange={(patch) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))}
              onSaveDraft={() => void handleSave("INACTIVE")}
              onPublish={() => void handleSave("ACTIVE")}
              onCancel={() => navigate("/help/faqs")}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
