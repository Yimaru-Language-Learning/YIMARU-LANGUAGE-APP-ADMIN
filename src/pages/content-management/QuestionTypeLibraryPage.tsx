import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Layers,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Input } from "../../components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { cn } from "../../lib/utils"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { QuestionTypeCard } from "./components/QuestionTypeCard"
import { QuestionTypeDefinitionPracticesDialog } from "./components/QuestionTypeDefinitionPracticesDialog"
import {
  deleteQuestionTypeDefinition,
  getQuestionTypeDefinitions,
} from "../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types"
import { PageBackLink } from "../../components/navigation/PageBackLink"

type StatusFilter = "All" | "ACTIVE" | "INACTIVE"
type ScopeFilter = "all" | "system" | "custom"

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "All", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
]

const SCOPE_OPTIONS: { value: ScopeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "system", label: "System only" },
  { value: "custom", label: "Custom only" },
]

export function QuestionTypeLibraryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createdId = searchParams.get("created")
  const updatedId = searchParams.get("updated")

  const [loading, setLoading] = useState(true)
  const [definitions, setDefinitions] = useState<QuestionTypeDefinition[]>([])
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>("all")
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [offset, setOffset] = useState(0)
  const [definitionPendingDelete, setDefinitionPendingDelete] = useState<QuestionTypeDefinition | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)
  const [definitionForPractices, setDefinitionForPractices] = useState<QuestionTypeDefinition | null>(null)

  const hasActiveFilters =
    query.trim().length > 0 || statusFilter !== "All" || scopeFilter !== "all"

  const activeFilterCount = countActiveFilters([
    { value: statusFilter, defaultValue: "All" },
    { value: scopeFilter, defaultValue: "all" },
  ])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { definitions: rows } = await getQuestionTypeDefinitions({
        include_system: scopeFilter !== "custom",
        ...(statusFilter !== "All" ? { status: statusFilter } : {}),
      })
      const visibleRows =
        scopeFilter === "system" ? rows.filter((d) => d.is_system) : rows
      setDefinitions(visibleRows)
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to load question type definitions")
      setDefinitions([])
    } finally {
      setLoading(false)
    }
  }, [scopeFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setOffset(0)
  }, [query, pageSize, scopeFilter, statusFilter])

  useEffect(() => {
    if (createdId) {
      toast.success("Definition created", { description: `Id ${createdId}` })
    }
  }, [createdId])

  useEffect(() => {
    if (updatedId) {
      toast.success("Definition updated", { description: `Id ${updatedId}` })
    }
  }, [updatedId])

  const isSystemScope = scopeFilter === "system"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return definitions
    return definitions.filter((d) => {
      const name = (d.display_name || "").toLowerCase()
      const key = (d.key || "").toLowerCase()
      return name.includes(q) || key.includes(q) || String(d.id).includes(q)
    })
  }, [definitions, query])

  const paginated = useMemo(() => {
    if (isSystemScope) return filtered
    return filtered.slice(offset, offset + pageSize)
  }, [filtered, isSystemScope, offset, pageSize])

  const totalCount = filtered.length
  const canPrev = !isSystemScope && offset > 0
  const canNext = !isSystemScope && offset + pageSize < totalCount

  const pageStart = totalCount === 0 ? 0 : isSystemScope ? 1 : offset + 1
  const pageEnd = isSystemScope ? filtered.length : Math.min(offset + paginated.length, totalCount)

  const resetPagination = () => setOffset(0)

  const clearFilters = () => {
    setQuery("")
    setStatusFilter("All")
    setScopeFilter("all")
    setOffset(0)
  }

  const openDeleteConfirm = (row: QuestionTypeDefinition) => {
    if (row.is_system) {
      toast.error("System definitions cannot be deleted.")
      return
    }
    setDefinitionPendingDelete(row)
  }

  const handleDeleteDialogOpenChange = (open: boolean) => {
    if (!open && !deleteSubmitting) setDefinitionPendingDelete(null)
  }

  const handleConfirmDeleteDefinition = async () => {
    const row = definitionPendingDelete
    if (!row) return
    setDeleteSubmitting(true)
    try {
      await deleteQuestionTypeDefinition(row.id)
      toast.success("Definition deleted")
      setDefinitionPendingDelete(null)
      void load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } }
      notifyApiError(err, "Delete failed")
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <PageBackLink
          fallbackTo="/new-content"
          label="Back to Content Management"
          className="font-bold"
          iconClassName="h-5 w-5 group-hover:-translate-x-1"
        />

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-[32px] font-medium text-grayScale-900 tracking-tight">Question type definitions</h1>
            <p className="text-grayScale-500 text-[16px] font-medium max-w-2xl">
              Reusable templates that define how practice and assessment questions are structured and answered.
            </p>
          </div>
          <Link to="/new-content/question-types/create">
            <Button className="h-12 px-8 rounded-[6px] bg-[#9E2891] font-bold text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3">
              <Plus className="h-5 w-5" />
              Create definition
            </Button>
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden rounded-2xl border border-grayScale-200 bg-white shadow-none">
        <CardHeader className="border-b border-grayScale-100 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                <Layers className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-grayScale-900">Definition library</CardTitle>
                <p className="text-xs text-grayScale-500 mt-0.5">
                  Browse and filter templates from the question type catalog
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-[6px] border-grayScale-200"
              disabled={loading}
              onClick={() => {
                void load()
              }}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-b border-grayScale-100 bg-grayScale-50/60 px-6 py-5">
            <AdminFiltersPanel
              className="border-0 bg-transparent shadow-none"
              activeFilterCount={activeFilterCount}
              onClearFilters={clearFilters}
              search={
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                  <Input
                    className="h-11 pl-11 pr-10 rounded-[10px] border-grayScale-200 bg-white placeholder:text-grayScale-400 text-sm shadow-sm"
                    placeholder="Search by display name, key, or id…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  {query ? (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-[6px] p-1 text-grayScale-400 hover:bg-grayScale-100 hover:text-grayScale-600"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              }
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Status
                  </span>
                  {STATUS_OPTIONS.map(({ value, label }) => (
                    <FilterChip
                      key={value}
                      label={label}
                      active={statusFilter === value}
                      disabled={loading}
                      onClick={() => {
                        setStatusFilter(value)
                        resetPagination()
                      }}
                    />
                  ))}
                </div>

                <span className="hidden h-5 w-px bg-grayScale-200 sm:block" />

                <div className="flex flex-wrap items-center gap-2">
                  <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    Scope
                  </span>
                  {SCOPE_OPTIONS.map(({ value, label }) => (
                    <FilterChip
                      key={value}
                      label={label}
                      active={scopeFilter === value}
                      disabled={loading}
                      onClick={() => {
                        setScopeFilter(value)
                        resetPagination()
                      }}
                    />
                  ))}
                </div>
              </div>
            </AdminFiltersPanel>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <p className="text-sm text-grayScale-500">Loading definitions…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-grayScale-100 text-grayScale-400">
                <Layers className="h-7 w-7" aria-hidden />
              </div>
              <p className="text-sm font-semibold text-grayScale-700">
                {hasActiveFilters ? "No definitions match your filters" : "No definitions yet"}
              </p>
              <p className="max-w-sm text-xs text-grayScale-500">
                {hasActiveFilters
                  ? "Try different filters or clear them to see more results."
                  : "Create a definition to start building custom question templates."}
              </p>
              {hasActiveFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
                  onClick={clearFilters}
                >
                  Clear filters
                </Button>
              ) : (
                <Link to="/new-content/question-types/create">
                  <Button size="sm" className="rounded-[6px] bg-brand-600 hover:bg-brand-500">
                    <Plus className="mr-2 h-4 w-4" />
                    Create definition
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((d) => (
                <QuestionTypeCard
                  key={d.id}
                  id={d.id}
                  definitionKey={d.key}
                  display_name={d.display_name}
                  status={d.status}
                  is_system={d.is_system}
                  stimulusKindsCount={d.stimulus_component_kinds?.length ?? 0}
                  responseKindsCount={d.response_component_kinds?.length ?? 0}
                  searchQuery={query}
                  deleteDisabled={!!d.is_system}
                  onEdit={() => navigate(`/new-content/question-types/${d.id}/edit`)}
                  onCreatePractice={() =>
                    navigate(`/new-content/question-types/${d.id}/create-practice`)
                  }
                  onViewPractices={() => setDefinitionForPractices(d)}
                  onDelete={() => openDeleteConfirm(d)}
                />
              ))}
            </div>
          )}

          {!loading && (definitions.length > 0 || offset > 0) ? (
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-grayScale-100 bg-white px-6 py-4">
              <div className="flex flex-wrap items-center gap-3 text-xs text-grayScale-500">
                <span>
                  {totalCount === 0
                    ? "No results"
                    : `Showing ${pageStart}–${pageEnd} of ${totalCount}`}
                </span>
                {query.trim() && filtered.length !== definitions.length ? (
                  <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-[11px] font-semibold text-brand-600">
                    {filtered.length} match{filtered.length === 1 ? "" : "es"} total
                  </span>
                ) : null}
                {!isSystemScope ? (
                  <>
                    <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
                    <span className="flex items-center gap-2">
                      Per page
                      <div className="relative">
                        <select
                          value={pageSize}
                          disabled={loading}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setOffset(0)
                          }}
                          className="h-8 appearance-none rounded-[8px] border border-grayScale-200 bg-white pl-2.5 pr-8 text-sm font-medium text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-brand-200"
                        >
                          {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                            <option key={size} value={size}>
                              {size}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                      </div>
                    </span>
                  </>
                ) : null}
              </div>

              {!isSystemScope ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[6px] border-grayScale-200"
                    disabled={!canPrev || loading}
                    onClick={() => setOffset((o) => Math.max(0, o - pageSize))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="rounded-[6px] border-grayScale-200"
                    disabled={!canNext || loading}
                    onClick={() => setOffset((o) => o + pageSize)}
                  >
                    Next
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <QuestionTypeDefinitionPracticesDialog
        definition={definitionForPractices}
        open={definitionForPractices !== null}
        onOpenChange={(open) => {
          if (!open) setDefinitionForPractices(null)
        }}
      />

      <Dialog open={definitionPendingDelete !== null} onOpenChange={handleDeleteDialogOpenChange}>
        <DialogContent className="max-w-md rounded-2xl border-grayScale-200 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-grayScale-900">
              <Trash2 className="h-5 w-5 text-red-600 shrink-0" aria-hidden />
              Delete question type definition?
            </DialogTitle>
            <DialogDescription className="text-left text-grayScale-600">
              This removes the template from the library. Existing questions that reference it may be affected. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {definitionPendingDelete ? (
            <div className="rounded-xl border border-grayScale-200 bg-grayScale-50 px-4 py-3 space-y-1">
              <p className="text-sm font-semibold text-grayScale-900">{definitionPendingDelete.display_name}</p>
              <p className="text-xs font-mono text-grayScale-500 break-all">
                #{definitionPendingDelete.id} · {definitionPendingDelete.key}
              </p>
            </div>
          ) : null}
          <DialogFooter className="gap-2 border-t border-grayScale-100 px-6 py-4 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="border-grayScale-200"
              disabled={deleteSubmitting}
              onClick={() => setDefinitionPendingDelete(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleteSubmitting}
              className="gap-2"
              onClick={() => void handleConfirmDeleteDefinition()}
            >
              {deleteSubmitting ? <SpinnerIcon className="h-4 w-4" /> : <Trash2 className="h-4 w-4" aria-hidden />}
              {deleteSubmitting ? "Deleting…" : "Delete definition"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FilterChip({
  label,
  active,
  disabled,
  onClick,
}: {
  label: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-[6px] border px-3.5 py-1.5 text-xs font-semibold transition-all",
        active
          ? "border-brand-500 bg-brand-500 text-white shadow-sm shadow-brand-500/20"
          : "border-grayScale-200 bg-white text-grayScale-600 hover:border-brand-200 hover:text-brand-600",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      {label}
    </button>
  )
}
