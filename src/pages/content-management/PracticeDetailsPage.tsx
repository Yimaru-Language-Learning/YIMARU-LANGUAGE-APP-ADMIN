import { useCallback, useEffect, useMemo, useState } from "react"
import { RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Button } from "../../components/ui/button"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { Badge } from "../../components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { getQuestionSetById, getQuestionSets } from "../../api/courses.api"
import type { QuestionSet, QuestionSetDetail } from "../../types/course.types"

const statusColor: Record<string, string> = {
  PUBLISHED: "bg-green-100 text-green-700",
  DRAFT: "bg-amber-100 text-amber-700",
  ARCHIVED: "bg-grayScale-200 text-grayScale-600",
}

export function PracticeDetailsPage() {
  const [practices, setPractices] = useState<QuestionSet[]>([])
  const [selectedPracticeId, setSelectedPracticeId] = useState<number | null>(null)
  const [selectedPracticeDetail, setSelectedPracticeDetail] = useState<QuestionSetDetail | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [ownerTypeFilter, setOwnerTypeFilter] = useState("all")

  const fetchPractices = useCallback(async () => {
    setLoadingList(true)
    try {
      const res = await getQuestionSets({ set_type: "PRACTICE" })
      const payload = res.data?.data as unknown
      let sets: QuestionSet[] = []
      if (Array.isArray(payload)) {
        sets = payload as QuestionSet[]
      } else if (
        payload &&
        typeof payload === "object" &&
        Array.isArray((payload as { question_sets?: unknown[] }).question_sets)
      ) {
        sets = (payload as { question_sets: QuestionSet[] }).question_sets
      }
      setPractices(sets)
      if (sets.length > 0) {
        setSelectedPracticeId((prev) => prev ?? sets[0].id)
      } else {
        setSelectedPracticeId(null)
        setSelectedPracticeDetail(null)
      }
    } catch (error) {
      console.error("Failed to fetch practices:", error)
      setPractices([])
      setSelectedPracticeId(null)
      setSelectedPracticeDetail(null)
    } finally {
      setLoadingList(false)
    }
  }, [])

  const fetchPracticeDetail = useCallback(async (practiceId: number) => {
    setLoadingDetail(true)
    try {
      const res = await getQuestionSetById(practiceId)
      setSelectedPracticeDetail(res.data?.data ?? null)
    } catch (error) {
      console.error("Failed to fetch practice detail:", error)
      setSelectedPracticeDetail(null)
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  useEffect(() => {
    fetchPractices()
  }, [fetchPractices])

  useEffect(() => {
    if (selectedPracticeId) {
      fetchPracticeDetail(selectedPracticeId)
    }
  }, [selectedPracticeId, fetchPracticeDetail])

  const filteredPractices = useMemo(() => {
    return practices.filter((practice) => {
      const matchesSearch =
        !searchQuery.trim() ||
        practice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (practice.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(practice.id).includes(searchQuery) ||
        String(practice.owner_id).includes(searchQuery)
      const matchesStatus = statusFilter === "all" || practice.status === statusFilter
      const matchesOwnerType = ownerTypeFilter === "all" || practice.owner_type === ownerTypeFilter
      return matchesSearch && matchesStatus && matchesOwnerType
    })
  }, [practices, searchQuery, statusFilter, ownerTypeFilter])

  const totalCount = useMemo(() => filteredPractices.length, [filteredPractices])

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-grayScale-600">Practice Management</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Browse all practice question sets and view their details.
          </p>
        </div>
        <Button variant="outline" onClick={fetchPractices} disabled={loadingList}>
          <RefreshCw className={`h-4 w-4 ${loadingList ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card className="shadow-soft">
        <CardHeader className="border-b border-grayScale-200 pb-4">
          <CardTitle className="text-base font-semibold text-grayScale-600">
            Practices ({totalCount})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-5">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="flex-1">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, description, practice ID, or owner ID..."
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="ARCHIVED">ARCHIVED</option>
              </Select>
              <Select value={ownerTypeFilter} onChange={(e) => setOwnerTypeFilter(e.target.value)}>
                <option value="all">All Owner Types</option>
                <option value="SUB_COURSE">SUB_COURSE</option>
                <option value="COURSE">COURSE</option>
              </Select>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("all")
                  setOwnerTypeFilter("all")
                }}
              >
                Clear
              </Button>
            </div>
          </div>

          {loadingList ? (
            <div className="py-16 text-center text-sm text-grayScale-500">Loading practices...</div>
          ) : filteredPractices.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-grayScale-200 py-16 text-center text-sm text-grayScale-500">
              No practice sets found.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-grayScale-200">
              <Table>
                <TableHeader>
                  <TableRow className="bg-grayScale-100 hover:bg-grayScale-100">
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">Title</TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">Owner</TableHead>
                    <TableHead className="py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500">Status</TableHead>
                    <TableHead className="hidden py-3 text-xs font-semibold uppercase tracking-wider text-grayScale-500 md:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPractices.map((practice, index) => (
                    <TableRow
                      key={practice.id}
                      onClick={() => {
                        setSelectedPracticeId(practice.id)
                        setDetailOpen(true)
                      }}
                      className={`cursor-pointer transition-colors hover:bg-brand-100/30 ${
                        selectedPracticeId === practice.id
                          ? "bg-brand-100/40"
                          : index % 2 === 0
                            ? "bg-white"
                            : "bg-grayScale-100/50"
                      }`}
                    >
                      <TableCell className="max-w-md py-3.5">
                        <p className="truncate text-sm font-medium text-grayScale-700">{practice.title}</p>
                        <p className="mt-1 truncate text-xs text-grayScale-500">{practice.description || "—"}</p>
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 md:table-cell">
                        {practice.owner_type} #{practice.owner_id}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Badge className={statusColor[practice.status] || "bg-grayScale-200 text-grayScale-600"}>
                          {practice.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 md:table-cell">
                        {practice.created_at}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Practice Detail</DialogTitle>
          </DialogHeader>
          {!selectedPracticeId ? (
            <p className="text-sm text-grayScale-500">Select a practice from the list to view details.</p>
          ) : loadingDetail ? (
            <p className="text-sm text-grayScale-500">Loading detail...</p>
          ) : !selectedPracticeDetail ? (
            <p className="text-sm text-grayScale-500">Failed to load practice detail.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Title</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.title}</p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Set Type</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.set_type}</p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3 sm:col-span-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Description</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.description || "—"}</p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Owner</p>
                <p className="mt-1 text-sm text-grayScale-700">
                  {selectedPracticeDetail.owner_type} #{selectedPracticeDetail.owner_id}
                </p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Status</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.status}</p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Question Count</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.question_count ?? 0}</p>
              </div>
              <div className="rounded-lg border border-grayScale-200 bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-500">Created At</p>
                <p className="mt-1 text-sm text-grayScale-700">{selectedPracticeDetail.created_at}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
