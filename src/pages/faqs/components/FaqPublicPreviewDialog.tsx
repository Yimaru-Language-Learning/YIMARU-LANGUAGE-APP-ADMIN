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
  DialogHeader,
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
      toast.error("Failed to load public FAQ preview")
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
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-brand-500" />
            Preview as learner
          </DialogTitle>
          <DialogDescription>
            Published FAQs from GET /faqs (ACTIVE only, no authentication).
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <label htmlFor="preview-category" className="text-xs font-semibold text-grayScale-500">
            Category
          </label>
          <select
            id="preview-category"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
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

        <div className="max-h-[55vh] space-y-4 overflow-y-auto pr-1">
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
                      className="rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3"
                    >
                      <p className="text-sm font-semibold text-grayScale-900">{faq.question}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-grayScale-600">
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
