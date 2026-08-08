import { notifyApiError } from "../../lib/apiErrors"
import { useCallback, useEffect, useMemo, useState } from "react"
import {
  AlertTriangle,
  Apple,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Smartphone,
  TabletSmartphone,
  Trash2,
} from "lucide-react"
import { toast } from "sonner"
import { getAppVersions } from "../../api/app-versions.api"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages"
import { cn } from "../../lib/utils"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import {
  formatAppPlatform,
  formatAppVersionCreatedAt,
  formatUpdateType,
  formatVersionStatus,
  versionLabel,
} from "../../lib/appVersions"
import type { AppPlatform, AppVersion, AppVersionStatus } from "../../types/app-version.types"
import { CreateAppVersionDialog } from "./components/CreateAppVersionDialog"
import { DeleteAppVersionDialog } from "./components/DeleteAppVersionDialog"
import { EditAppVersionDialog } from "./components/EditAppVersionDialog"

function PlatformIcon({ platform }: { platform: string }) {
  const upper = platform.toUpperCase()
  if (upper === "IOS") {
    return <Apple className="h-4 w-4" />
  }
  return <Smartphone className="h-4 w-4" />
}

function updateTypeBadgeVariant(updateType: string): "destructive" | "warning" | "info" | "secondary" {
  const t = updateType.toUpperCase()
  if (t === "FORCE") return "destructive"
  if (t === "SOFT") return "warning"
  return "info"
}

function statusBadgeVariant(status: string): "success" | "secondary" | "warning" {
  const s = status.toUpperCase()
  if (s === "ACTIVE") return "success"
  if (s === "DRAFT") return "warning"
  return "secondary"
}

export function AppVersionsTab() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [versions, setVersions] = useState<AppVersion[]>([])
  const [offset, setOffset] = useState(0)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [query, setQuery] = useState("")
  const [platformFilter, setPlatformFilter] = useState<"all" | AppPlatform>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | AppVersionStatus>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [versionToEdit, setVersionToEdit] = useState<AppVersion | null>(null)
  const [versionToDelete, setVersionToDelete] = useState<AppVersion | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(false)
    try {
      const allVersions = await fetchAllOffsetPages(async (batchOffset, limit) => {
        const res = await getAppVersions({ limit, offset: batchOffset })
        return {
          items: res.data.versions,
          total_count: res.data.total_count,
        }
      })
      setVersions(allVersions)
    } catch (e) {
      console.error(e)
      setError(true)
      setVersions([])
      notifyApiError(e, "Failed to load app versions")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setOffset(0)
  }, [query, platformFilter, statusFilter, pageSize])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...versions]
      .filter((v) => {
        if (platformFilter !== "all" && v.platform !== platformFilter) return false
        if (statusFilter !== "all" && v.status !== statusFilter) return false
        if (!q) return true
        const haystack = [
          v.version_name,
          String(v.version_code),
          v.platform,
          v.update_type,
          v.release_notes,
          v.status,
        ]
          .join(" ")
          .toLowerCase()
        return haystack.includes(q)
      })
      .sort((a, b) => b.version_code - a.version_code)
  }, [versions, query, platformFilter, statusFilter])

  const androidCount = versions.filter((v) => v.platform.toUpperCase() === "ANDROID").length
  const iosCount = versions.filter((v) => v.platform.toUpperCase() === "IOS").length
  const activeCount = versions.filter((v) => v.status.toUpperCase() === "ACTIVE").length
  const forceCount = versions.filter((v) => v.update_type.toUpperCase() === "FORCE").length

  const totalCount = filtered.length
  const paginated = filtered.slice(offset, offset + pageSize)
  const pageStart = totalCount === 0 ? 0 : offset + 1
  const pageEnd = Math.min(offset + paginated.length, totalCount)
  const canPrev = offset > 0
  const canNext = offset + pageSize < totalCount

  const handleCreated = (version: AppVersion) => {
    if (offset === 0) {
      setVersions((prev) => {
        const without = prev.filter((v) => v.id !== version.id)
        return [version, ...without]
      })
      setTotalCount((c) => c + 1)
    } else {
      setOffset(0)
    }
  }

  const handleUpdated = (version: AppVersion) => {
    setVersions((prev) => prev.map((v) => (v.id === version.id ? version : v)))
  }

  const handleDeleted = (id: number) => {
    setVersions((prev) => prev.filter((v) => v.id !== id))
    setTotalCount((c) => Math.max(0, c - 1))
  }

  const activeFilterCount = countActiveFilters([
    { value: platformFilter, defaultValue: "all" },
    { value: statusFilter, defaultValue: "all" },
  ])

  const clearFilters = () => {
    setPlatformFilter("all")
    setStatusFilter("all")
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 min-w-0 w-full max-w-full space-y-6 duration-300">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-brand-500">
            Mobile releases
          </p>
          <h2 className="text-lg font-bold text-grayScale-900">App version control</h2>
          <p className="mt-1 max-w-2xl text-sm text-grayScale-500">
            Manage Android and iOS release metadata for in-app update prompts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="shrink-0 rounded-[6px] bg-brand-500 font-semibold text-white hover:bg-brand-600"
            onClick={() => setCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New version
          </Button>
          <Button
            variant="outline"
            className="shrink-0 rounded-[6px]"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-brand-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-brand-50 text-brand-600">
              <TabletSmartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Total versions</p>
              <p className="text-2xl font-bold text-grayScale-900">{totalCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-mint-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-mint-50 text-mint-600">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Android · iOS</p>
              <p className="text-2xl font-bold text-grayScale-900">
                {androidCount} · {iosCount}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-sky-500" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-sky-50 text-sky-600">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Active on page</p>
              <p className="text-2xl font-bold text-grayScale-900">{activeCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="overflow-hidden rounded-[8px] border border-grayScale-100 shadow-none">
          <div className="h-1 bg-destructive" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-[8px] bg-red-50 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-grayScale-500">Force updates</p>
              <p className="text-2xl font-bold text-grayScale-900">{forceCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 rounded-[8px] border border-grayScale-100 shadow-none">
        <CardHeader className="border-b border-grayScale-50 pb-4">
          <CardTitle className="text-sm font-bold text-grayScale-900">Release history</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 p-4 sm:p-6">
          <AdminFiltersPanel
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            search={
              <div className="relative w-full min-w-0">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  className="w-full rounded-[6px] pl-9"
                  placeholder="Search version, notes, platform…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
          >
            <div className="flex min-w-0 flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All platforms" },
                  { id: "ANDROID", label: "Android" },
                  { id: "IOS", label: "iOS" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatformFilter(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    platformFilter === tab.id
                      ? "bg-brand-500 text-white"
                      : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex min-w-0 flex-wrap gap-2">
              {(
                [
                  { id: "all", label: "All statuses" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "INACTIVE", label: "Inactive" },
                  { id: "DRAFT", label: "Draft" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                    statusFilter === tab.id
                      ? "bg-grayScale-800 text-white"
                      : "bg-grayScale-100 text-grayScale-600 hover:bg-grayScale-200",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </AdminFiltersPanel>

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16">
              <SpinnerIcon className="h-8 w-8 text-brand-500" />
              <p className="text-sm text-grayScale-500">Loading app versions…</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16">
              <p className="text-sm font-medium text-grayScale-700">Could not load versions</p>
              <Button variant="outline" size="sm" className="rounded-[6px]" onClick={() => void load()}>
                Try again
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-[8px] border border-dashed border-grayScale-200 py-16 text-center">
              <TabletSmartphone className="h-10 w-10 text-grayScale-300" />
              <p className="text-sm font-medium text-grayScale-700">
                {versions.length === 0 ? "No app versions yet" : "No versions match your filters"}
              </p>
              <p className="max-w-sm text-xs text-grayScale-500">
                {versions.length === 0
                  ? "Publish your first Android or iOS release to control learner update prompts."
                  : "Try a different search or filter."}
              </p>
              {versions.length === 0 ? (
                <Button
                  className="mt-1 rounded-[6px] bg-brand-500 text-white hover:bg-brand-600"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Publish version
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="min-w-0 w-full max-w-full overflow-x-auto overscroll-x-contain rounded-[8px] border border-grayScale-100 [-webkit-overflow-scrolling:touch]">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-grayScale-100 bg-grayScale-50/80 text-[11px] font-bold uppercase tracking-wider text-grayScale-400">
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Release</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Platform</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Update</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Min</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Status</th>
                    <th className="min-w-[140px] px-3 py-3 sm:px-4">Notes</th>
                    <th className="whitespace-nowrap px-3 py-3 sm:px-4">Published</th>
                    <th className="sticky right-0 z-10 whitespace-nowrap bg-grayScale-50/95 px-3 py-3 text-right shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.12)] backdrop-blur-sm sm:px-4">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-grayScale-50">
                  {paginated.map((version) => (
                    <tr key={version.id} className="group transition-colors hover:bg-grayScale-50/60">
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <p className="font-semibold text-grayScale-900">
                          {versionLabel(version)}
                        </p>
                        <p className="mt-0.5 text-xs text-grayScale-400">ID {version.id}</p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <Badge
                          variant="secondary"
                          className="inline-flex items-center gap-1.5 font-medium"
                        >
                          <PlatformIcon platform={version.platform} />
                          {formatAppPlatform(version.platform)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <Badge variant={updateTypeBadgeVariant(version.update_type)}>
                          {formatUpdateType(version.update_type)}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 font-mono text-xs text-grayScale-700 sm:px-4 sm:py-4">
                        {version.min_supported_version_code}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 sm:px-4 sm:py-4">
                        <Badge variant={statusBadgeVariant(version.status)}>
                          {formatVersionStatus(version.status)}
                        </Badge>
                      </td>
                      <td className="max-w-[180px] px-3 py-3 sm:px-4 sm:py-4">
                        <p className="line-clamp-2 text-xs text-grayScale-600">
                          {version.release_notes}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-grayScale-500 sm:px-4 sm:py-4">
                        <span className="inline-flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 shrink-0" />
                          {formatAppVersionCreatedAt(version.created_at)}
                        </span>
                      </td>
                      <td className="sticky right-0 z-10 whitespace-nowrap bg-white px-3 py-3 shadow-[-8px_0_12px_-8px_rgba(0,0,0,0.08)] group-hover:bg-grayScale-50/60 sm:px-4 sm:py-4">
                        <div className="flex justify-end gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-brand-600"
                            asChild
                          >
                            <a
                              href={version.store_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open store for ${versionLabel(version)}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-brand-600"
                            aria-label={`Edit ${versionLabel(version)}`}
                            onClick={() => setVersionToEdit(version)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 rounded-[6px] p-0 text-grayScale-500 hover:text-destructive"
                            aria-label={`Delete ${versionLabel(version)}`}
                            onClick={() => setVersionToDelete(version)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && totalCount > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-grayScale-100 pt-4 text-sm text-grayScale-500">
              <div className="flex flex-wrap items-center gap-2">
                <span>
                  Showing {pageStart}–{pageEnd} of {totalCount}
                </span>
                <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
                <span className="flex items-center gap-2">
                  Rows per page
                  <div className="relative">
                    <select
                      value={pageSize}
                      disabled={loading}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value))
                        setOffset(0)
                      }}
                      className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
                    >
                      {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                        <option key={size} value={size}>
                          {size}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400" />
                  </div>
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-[6px]"
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
                  className="rounded-[6px]"
                  disabled={!canNext || loading}
                  onClick={() => setOffset((o) => o + pageSize)}
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <CreateAppVersionDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleCreated}
      />

      <EditAppVersionDialog
        version={versionToEdit}
        open={versionToEdit != null}
        onOpenChange={(open) => {
          if (!open) setVersionToEdit(null)
        }}
        onUpdated={handleUpdated}
      />

      <DeleteAppVersionDialog
        version={versionToDelete}
        open={versionToDelete != null}
        onOpenChange={(open) => {
          if (!open) setVersionToDelete(null)
        }}
        onDeleted={handleDeleted}
      />
    </div>
  )
}
