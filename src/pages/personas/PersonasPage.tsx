import { useCallback, useEffect, useMemo, useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCircle2,
} from "lucide-react"
import { toast } from "sonner"
import { listPersonas, updatePersona } from "../../api/personas.api"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { ToggleSwitch } from "../../components/ui/toggle-switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { usePersonaPermissions } from "../../hooks/usePersonaPermissions"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages"
import { PersonaAvatar } from "../../components/personas/PersonaAvatar"
import {
  formatPersonaDate,
  personaAvatarUrl,
  personaGenderLabel,
  personaStatusLabel,
} from "../../lib/personaDisplay"
import { notifyApiError } from "../../lib/apiErrors"
import { isPersonaForbiddenError } from "../../lib/personasErrors"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import type { LmsPersona } from "../../types/persona.types"
import { CreatePersonaDialog } from "./components/CreatePersonaDialog"
import { EditPersonaDialog } from "./components/EditPersonaDialog"
import { PersonaAccessDenied } from "./components/PersonaAccessDenied"
import { PersonaDeleteDialog } from "./components/PersonaDeleteDialog"

type PersonaStatusFilter = "all" | "active" | "inactive"

export function PersonasPage() {
  const {
    canList,
    canCreate,
    canUpdate,
    canDelete,
    loading: permissionsLoading,
  } = usePersonaPermissions()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [personas, setPersonas] = useState<LmsPersona[]>([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [query, setQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<PersonaStatusFilter>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [personaPendingEdit, setPersonaPendingEdit] = useState<LmsPersona | null>(null)
  const [personaPendingDelete, setPersonaPendingDelete] = useState<LmsPersona | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const load = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setPermissionDenied(false)

    try {
      const allPersonas = await fetchAllOffsetPages(async (batchOffset, limit) => {
        const res = await listPersonas({
          active_only: statusFilter === "active",
          limit,
          offset: batchOffset,
        })
        return {
          items: res.data.personas,
          total_count: res.data.total_count,
        }
      })
      setPersonas(allPersonas)
    } catch (e) {
      console.error(e)
      setError(true)
      setPersonas([])
      if (isPersonaForbiddenError(e)) {
        setPermissionDenied(true)
        notifyApiError(e, "You do not have permission to view personas")
      } else {
        notifyApiError(e, "Failed to load personas")
      }
    } finally {
      setLoading(false)
    }
  }, [canList, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [statusFilter, pageSize, query])

  const filtered = useMemo(() => {
    let rows = personas
    if (statusFilter === "inactive") {
      rows = rows.filter((persona) => !persona.is_active)
    }

    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((persona) => {
      const haystack = [
        persona.name,
        persona.description ?? "",
        persona.gender ?? "",
        String(persona.id),
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [personas, query, statusFilter])

  const activeFilterCount = countActiveFilters([
    { value: statusFilter, defaultValue: "all" },
  ])

  const clearFilters = () => {
    setStatusFilter("all")
    setQuery("")
    setPage(1)
  }

  const totalCount = filtered.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginated = filtered.slice((safePage - 1) * pageSize, safePage * pageSize)
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, totalCount)

  const handleToggleActive = async (persona: LmsPersona) => {
    if (!canUpdate) {
      toast.error("You do not have permission to update personas")
      return
    }

    setTogglingId(persona.id)
    try {
      const res = await updatePersona(persona.id, { is_active: !persona.is_active })
      if (res.data) {
        setPersonas((prev) => prev.map((row) => (row.id === persona.id ? res.data! : row)))
      }
      toast.success(res.data?.is_active ? "Persona activated" : "Persona deactivated")
      if (statusFilter === "active" && res.data && !res.data.is_active) {
        void load()
      }
    } catch (e) {
      console.error(e)
      notifyApiError(e, "Failed to update persona status")
    } finally {
      setTogglingId(null)
    }
  }

  if (!permissionsLoading && !canList) {
    return <PersonaAccessDenied />
  }

  if (!permissionsLoading && permissionDenied) {
    return <PersonaAccessDenied apiForbidden />
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-grayScale-500">Learning content</p>
          <h1 className="text-2xl font-semibold tracking-tight text-grayScale-800">Personas</h1>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Manage coach and character profiles linked to practice shells in Learn English and
            Duolingo/IELTS content.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="shrink-0" disabled={loading} onClick={() => void load()}>
            {loading ? <SpinnerIcon className="mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
          {canCreate ? (
            <Button
              className="shrink-0 bg-brand-500 text-white hover:bg-brand-600"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              New persona
            </Button>
          ) : null}
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="space-y-5 pt-5">
          <AdminFiltersPanel
            className="border-0 shadow-none"
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            summary={
              totalCount > 0
                ? `Showing ${startEntry}–${endEntry} of ${totalCount}`
                : "No personas"
            }
            search={
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  placeholder="Search by name, description, gender, or ID…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
            actions={
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PersonaStatusFilter)}
                className="h-9 w-[11rem] rounded-md text-sm"
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            }
          />

          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[72px]">Avatar</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Gender</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <SpinnerIcon className="h-6 w-6 text-brand-500" />
                        <span className="text-sm text-grayScale-400">Loading personas…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-sm text-grayScale-500">
                      Failed to load personas. Try refreshing.
                    </TableCell>
                  </TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <UserCircle2 className="h-8 w-8 text-grayScale-200" />
                        <p className="text-sm font-medium text-grayScale-500">
                          {totalCount === 0 ? "No personas yet" : "No personas match your search"}
                        </p>
                        <p className="text-xs text-grayScale-400">
                          {canCreate
                            ? "Create a persona to use in practice authoring."
                            : "Ask an admin to create personas for your team."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((persona) => (
                    <TableRow key={persona.id}>
                      <TableCell className="py-3.5">
                        <PersonaAvatar
                          src={personaAvatarUrl(
                            persona.profile_picture,
                            persona.name,
                            persona.id,
                          )}
                          alt={persona.name}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <p className="text-sm font-semibold text-grayScale-700">{persona.name}</p>
                        {persona.description ? (
                          <p className="mt-0.5 line-clamp-2 text-xs text-grayScale-500">
                            {persona.description}
                          </p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 md:table-cell">
                        {personaGenderLabel(persona.gender)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        {canUpdate ? (
                          <ToggleSwitch
                            checked={persona.is_active}
                            disabled={togglingId === persona.id}
                            aria-label={
                              persona.is_active ? "Deactivate persona" : "Activate persona"
                            }
                            onCheckedChange={() => void handleToggleActive(persona)}
                          />
                        ) : (
                          <Badge variant={persona.is_active ? "default" : "outline"}>
                            {personaStatusLabel(persona.is_active)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden py-3.5 text-sm text-grayScale-500 lg:table-cell">
                        {formatPersonaDate(persona.updated_at ?? persona.created_at)}
                      </TableCell>
                      <TableCell className="py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2"
                              onClick={() => setPersonaPendingEdit(persona)}
                            >
                              <Pencil className="mr-1 h-3.5 w-3.5" />
                              Edit
                            </Button>
                          ) : null}
                          {canDelete ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-destructive hover:text-destructive"
                              onClick={() => setPersonaPendingDelete(persona)}
                            >
                              <Trash2 className="mr-1 h-3.5 w-3.5" />
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-grayScale-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-grayScale-500">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-grayScale-200 bg-white px-2 text-sm"
                >
                  {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-sm text-grayScale-500">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreatePersonaDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void load()}
      />

      <EditPersonaDialog
        persona={personaPendingEdit}
        open={personaPendingEdit != null}
        onOpenChange={(open) => {
          if (!open) setPersonaPendingEdit(null)
        }}
        onUpdated={() => void load()}
      />

      <PersonaDeleteDialog
        persona={personaPendingDelete}
        open={personaPendingDelete != null}
        onOpenChange={(open) => {
          if (!open) setPersonaPendingDelete(null)
        }}
        onDeleted={() => void load()}
      />
    </div>
  )
}
