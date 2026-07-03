import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Eye,
  EyeOff,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { getFAQs, updateFAQ } from "../../api/faq.api"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { useFaqPermissions } from "../../hooks/useFaqPermissions"
import {
  deriveFaqCategories,
  faqStatusBadgeVariant,
  faqStatusLabel,
  formatFaqDate,
  suggestNextDisplayOrder,
} from "../../lib/faqDisplay"
import { notifyApiError } from "../../lib/apiErrors"
import { isFaqForbiddenError } from "../../lib/faqErrors"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { cn } from "../../lib/utils"
import type { FAQ, FAQStatus } from "../../types/faq.types"
import { CreateFaqDialog } from "./components/CreateFaqDialog"
import { FaqDeleteDialog } from "./components/FaqDeleteDialog"
import { FaqAccessDenied } from "./components/FaqAccessDenied"
import { FaqPublicPreviewDialog } from "./components/FaqPublicPreviewDialog"

type StatusFilter = "all" | FAQStatus

export function FaqsPage() {
  const { canList, canCreate, canUpdate, canDelete, canGet, loading: permissionsLoading } =
    useFaqPermissions()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [allCategories, setAllCategories] = useState<string[]>([])
  const [faqPendingDelete, setFaqPendingDelete] = useState<FAQ | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [suggestedDisplayOrder, setSuggestedDisplayOrder] = useState(1)

  const load = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setPermissionDenied(false)
    try {
      const allFaqs = await fetchAllOffsetPages(async (batchOffset, limit) => {
        const res = await getFAQs({
          status: statusFilter === "all" ? undefined : statusFilter,
          category: categoryFilter || undefined,
          limit,
          offset: batchOffset,
        })
        return {
          items: res.data.faqs,
          total_count: res.data.total_count,
        }
      })
      setFaqs(allFaqs)

      const categoryRes = await getFAQs({ limit: 200, offset: 0 })
      setAllCategories(deriveFaqCategories(categoryRes.data.faqs))
      setSuggestedDisplayOrder(suggestNextDisplayOrder(categoryRes.data.faqs))
    } catch (e) {
      console.error(e)
      setError(true)
      setFaqs([])
      if (isFaqForbiddenError(e)) {
        setPermissionDenied(true)
        notifyApiError(e, "You do not have permission to view FAQs")
      } else {
        notifyApiError(e, "Failed to load FAQs")
      }
    } finally {
      setLoading(false)
    }
  }, [canList, statusFilter, categoryFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, categoryFilter, pageSize, query])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return faqs
    return faqs.filter((faq) => {
      const haystack = [faq.question, faq.answer, faq.category ?? ""]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [faqs, query])

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const pageStart = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const pageEnd = Math.min(safePage * pageSize, totalCount)
  const canPrev = page > 1
  const canNext = page < totalPages

  const activeFilterCount = countActiveFilters([
    { value: statusFilter, defaultValue: "all" },
    { value: categoryFilter },
  ])

  const clearFilters = () => {
    setStatusFilter("all")
    setCategoryFilter("")
  }

  const handleToggleStatus = async (faq: FAQ) => {
    if (!canUpdate) {
      toast.error("You do not have permission to update FAQs")
      return
    }

    const nextStatus: FAQStatus = faq.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"
    setTogglingId(faq.id)
    try {
      const res = await updateFAQ(faq.id, { status: nextStatus })
      if (res.data) {
        setFaqs((prev) => prev.map((row) => (row.id === faq.id ? res.data! : row)))
      }
      toast.success(
        nextStatus === "ACTIVE" ? "FAQ published" : "FAQ moved to draft",
      )
    } catch (e: unknown) {
      console.error(e)
      notifyApiError(e, "Failed to update FAQ status")
    } finally {
      setTogglingId(null)
    }
  }

  if (!permissionsLoading && !canList) {
    return <FaqAccessDenied />
  }

  if (!permissionsLoading && permissionDenied) {
    return <FaqAccessDenied apiForbidden />
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Help center</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">
            FAQs
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Manage frequently asked questions shown in the learner help center.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="shrink-0" onClick={() => setPreviewOpen(true)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            Preview as learner
          </Button>
          {canCreate ? (
            <Button
              className="shrink-0 bg-brand-500 text-white hover:bg-brand-600"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add FAQ
            </Button>
          ) : null}
          <Button
            variant="outline"
            className="shrink-0"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <AdminFiltersPanel
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        summary={
          loading
            ? "Loading…"
            : `${totalCount} shown · ${faqs.length} loaded`
        }
        search={
          <div className="relative w-full">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              className="pl-9"
              placeholder="Search question or answer…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "ACTIVE", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-semibold transition-colors",
                statusFilter === tab
                  ? "bg-brand-500 text-white"
                  : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
              )}
            >
              {tab === "all" ? "All" : tab === "ACTIVE" ? "Published" : "Draft"}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="faq-category-filter" className="text-xs font-semibold text-grayScale-500">
            Category
          </label>
          <select
            id="faq-category-filter"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-9 rounded-lg border border-grayScale-200 bg-white px-3 text-sm text-grayScale-800"
          >
            <option value="">All categories</option>
            {allCategories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </AdminFiltersPanel>

      {loading ? (
        <div className="flex justify-center py-16">
          <SpinnerIcon className="h-6 w-6" />
        </div>
      ) : error ? (
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-destructive">Could not load FAQs.</p>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="border border-grayScale-100 shadow-none">
          <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-100/50 text-brand-500">
              <CircleHelp className="h-7 w-7" />
            </div>
            <p className="text-sm text-grayScale-500">
              {faqs.length === 0
                ? "No FAQs yet. Create your first FAQ to populate the help center."
                : "No FAQs match your search or filters."}
            </p>
            {canCreate && faqs.length === 0 ? (
              <Button
                className="bg-brand-500 text-white hover:bg-brand-600"
                onClick={() => setCreateOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add FAQ
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden border border-grayScale-100 shadow-none">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="w-20 text-center">Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 font-medium text-grayScale-900">
                        {faq.question}
                      </p>
                    </TableCell>
                    <TableCell>
                      {faq.category ? (
                        <Badge variant="secondary">{faq.category}</Badge>
                      ) : (
                        <span className="text-xs text-grayScale-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center text-sm text-grayScale-600">
                      {faq.display_order}
                    </TableCell>
                    <TableCell>
                      <Badge variant={faqStatusBadgeVariant(faq.status)}>
                        {faqStatusLabel(faq.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-grayScale-500">
                      {formatFaqDate(faq.updated_at || faq.created_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {canUpdate ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingId === faq.id}
                            onClick={() => void handleToggleStatus(faq)}
                            title={
                              faq.status === "ACTIVE" ? "Unpublish" : "Publish"
                            }
                          >
                            {faq.status === "ACTIVE" ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                            <span className="sr-only">
                              {faq.status === "ACTIVE" ? "Unpublish" : "Publish"}
                            </span>
                          </Button>
                        ) : null}
                        {canGet ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/help/faqs/${faq.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                              <span className="sr-only">Edit</span>
                            </Link>
                          </Button>
                        ) : null}
                        {canDelete ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => setFaqPendingDelete(faq)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {!loading && !error && totalCount > 0 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-grayScale-500">
            Showing {pageStart}–{pageEnd} of {totalCount}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="h-9 rounded-lg border border-grayScale-200 bg-white px-3 text-sm"
            >
              {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-grayScale-600">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : null}

      <FaqPublicPreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} />

      <CreateFaqDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        categories={allCategories}
        suggestedDisplayOrder={suggestedDisplayOrder}
        onCreated={() => void load()}
      />

      <FaqDeleteDialog
        faq={faqPendingDelete}
        open={faqPendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setFaqPendingDelete(null)
        }}
        onDeleted={() => {
          setFaqPendingDelete(null)
          void load()
        }}
      />
    </div>
  )
}
