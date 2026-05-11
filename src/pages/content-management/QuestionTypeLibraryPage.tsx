import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Plus, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Card } from "../../components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { cn } from "../../lib/utils"
import { QuestionTypeCard } from "./components/QuestionTypeCard"
import {
  deleteQuestionTypeDefinition,
  getQuestionTypeDefinitions,
} from "../../api/questionTypeDefinitions.api"
import type { QuestionTypeDefinition } from "../../types/questionTypeDefinition.types"

export function QuestionTypeLibraryPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const createdId = searchParams.get("created")
  const updatedId = searchParams.get("updated")

  const [loading, setLoading] = useState(true)
  const [definitions, setDefinitions] = useState<QuestionTypeDefinition[]>([])
  const [query, setQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"All" | "ACTIVE" | "INACTIVE">("All")
  const [definitionPendingDelete, setDefinitionPendingDelete] = useState<QuestionTypeDefinition | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await getQuestionTypeDefinitions({ include_system: true })
      setDefinitions(Array.isArray(rows) ? rows : [])
    } catch (e) {
      console.error(e)
      toast.error("Failed to load question type definitions")
      setDefinitions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return definitions.filter((d) => {
      if (activeTab !== "All") {
        const st = (d.status || "").toString().toUpperCase()
        if (activeTab === "ACTIVE" && st !== "ACTIVE") return false
        if (activeTab === "INACTIVE" && st !== "INACTIVE") return false
      }
      if (!q) return true
      const name = (d.display_name || "").toLowerCase()
      const key = (d.key || "").toLowerCase()
      return name.includes(q) || key.includes(q) || String(d.id).includes(q)
    })
  }, [definitions, query, activeTab])

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
      toast.error(String(err.response?.data?.message || "Delete failed"))
    } finally {
      setDeleteSubmitting(false)
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="space-y-6">
        <Link
          to="/new-content/courses"
          className="flex items-center gap-2 text-[15px] font-bold text-grayScale-600 transition-colors hover:text-brand-500 group w-fit"
        >
          <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
          Back to Courses
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h1 className="text-[32px] font-medium text-grayScale-900 tracking-tight">Question type definitions</h1>
            <p className="text-grayScale-500 text-[16px] font-medium max-w-2xl">
              Reusable dynamic question type templates from{" "}
              <code className="text-xs bg-grayScale-100 px-1 rounded">GET /questions/type-definitions</code>. Use them
              when authoring <code className="text-xs bg-grayScale-100 px-1 rounded">DYNAMIC</code> questions.
            </p>
          </div>
          <Link to="/new-content/question-types/create">
            <Button className="h-12 px-8 rounded-[10px] bg-[#9E2891] font-bold text-white shadow-lg shadow-brand-500/10 hover:bg-[#8A237E] transition-all flex items-center gap-3">
              <Plus className="h-5 w-5" />
              Create definition
            </Button>
          </Link>
        </div>
      </div>

      <Card className="p-6 border-grayScale-200 rounded-2xl bg-white space-y-6">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-grayScale-600" />
            <Input
              className="h-10 pl-12 rounded-[6px] border-grayScale-200 placeholder:text-grayScale-600 bg-[#F8FAFC] transition-all text-sm"
              placeholder="Search by display name, key, or id…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-[12px] font-medium text-grayScale-400 uppercase tracking-widest mr-2">Status</span>
          {(["All", "ACTIVE", "INACTIVE"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "h-10 px-4 rounded-full text-[13px] font-medium transition-all",
                activeTab === tab
                  ? "bg-[#9E2891] text-white shadow-md shadow-brand-500/20"
                  : "bg-grayScale-100 text-grayScale-400 hover:bg-grayScale-100",
              )}
            >
              {tab === "All" ? "All" : tab === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </Card>

      {loading ? (
        <p className="text-sm text-grayScale-500 px-2">Loading definitions…</p>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed border-grayScale-200 rounded-2xl">
          <p className="text-grayScale-600 font-medium">No definitions match your filters.</p>
          <p className="text-sm text-grayScale-400 mt-2">Create one to get started.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((d) => (
            <QuestionTypeCard
              key={d.id}
              id={d.id}
              definitionKey={d.key}
              display_name={d.display_name}
              status={d.status}
              is_system={d.is_system}
              stimulusKindsCount={d.stimulus_component_kinds?.length ?? 0}
              responseKindsCount={d.response_component_kinds?.length ?? 0}
              deleteDisabled={!!d.is_system}
              onEdit={() => navigate(`/new-content/question-types/${d.id}/edit`)}
              onDelete={() => openDeleteConfirm(d)}
            />
          ))}
        </div>
      )}

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
          <DialogFooter className="gap-2 sm:gap-0">
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
