import { notifyApiError } from "../../../lib/apiErrors"
import { useCallback, useEffect, useState } from "react"
import { Eye } from "lucide-react"
import { toast } from "sonner"
import { getPublicFAQs } from "../../../api/faq.api"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "../../../components/ui/dialog"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { deriveFaqCategories } from "../../../lib/faqDisplay"
import type { FAQ } from "../../../types/faq.types"

type FaqPublicPreviewDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FaqPublicPreviewDialog({
  open,
  onOpenChange,
}: FaqPublicPreviewDialogProps) {
  const [loading, setLoading] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [categoryFilter, setCategoryFilter] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getPublicFAQs({ limit: 200, offset: 0 })
      setFaqs(res.data.faqs)
    } catch (e) {
      console.error(e)
      setFaqs([])
      notifyApiError(e, "Failed to load public FAQ preview")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      void load()
    }
  }, [open, load])

  const categories = deriveFaqCategories(faqs)
  const filtered = categoryFilter
    ? faqs.filter((faq) => faq.category === categoryFilter)
    : faqs

  const grouped = filtered.reduce<Record<string, FAQ[]>>((acc, faq) => {
    const key = faq.category?.trim() || "General"
    if (!acc[key]) acc[key] = []
    acc[key].push(faq)
    return acc
  }, {})

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden p-0">
        <div className="flex items-center gap-3 border-b border-grayScale-100 px-6 py-5 pr-14">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-brand-100/60">
            <Eye className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <DialogTitle className="text-[15px] font-semibold text-grayScale-900">
              Preview as learner
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-grayScale-500">
              Published FAQs from GET /faqs (ACTIVE only, no authentication).
            </DialogDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 px-6 pt-4">
          <label htmlFor="preview-category" className="text-xs font-medium text-grayScale-600">
            Category
          </label>
          <select
            id="preview-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-lg border border-grayScale-200 bg-white px-3 text-xs dark:border-grayScale-200 dark:bg-grayScale-100 dark:text-grayScale-900"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" disabled={loading} onClick={() => void load()}>
            Refresh
          </Button>
        </div>

        <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="flex justify-center py-12">
              <SpinnerIcon className="h-6 w-6" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-grayScale-500">
              No published FAQs are visible on the public help center.
            </p>
          ) : (
            Object.entries(grouped).map(([category, rows]) => (
              <div key={category} className="space-y-2">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-grayScale-800">{category}</h3>
                  <Badge variant="secondary" className="text-[10px]">
                    {rows.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {rows.map((faq) => (
                    <div
                      key={faq.id}
                      className="rounded-[8px] border border-grayScale-100 bg-grayScale-50 px-4 py-3"
                    >
                      <p className="text-sm font-medium text-grayScale-900">{faq.question}</p>
                      <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-grayScale-600">
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
