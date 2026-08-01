import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  Activity,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  FileText,
  Globe,
  Info,
  Monitor,
  RefreshCw,
  Search,
  Shield,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { getApiErrorMessage, notifyApiError } from "../../../lib/apiErrors"
import {
  getActivityLogById,
  getActivityLogs,
} from "../../../api/activity-logs.api"
import { AdminFiltersPanel } from "../../../components/filters/AdminFiltersPanel"
import { ExportCsvButton } from "../../../components/export/ExportCsvButton"
import { ExportTruncationWarning } from "../../../components/export/ExportTruncationWarning"
import { Badge } from "../../../components/ui/badge"
import { Button } from "../../../components/ui/button"
import { Input } from "../../../components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table"
import { SpinnerIcon } from "../../../components/ui/spinner-icon"
import { countActiveFilters } from "../../../lib/adminFilterUtils"
import {
  ACTION_FILTER_GROUPS,
  RESOURCE_TYPE_OPTIONS,
  actionBadgeClasses,
  actionLabel,
  activityLogResourcePath,
  formatActivityDate,
  formatActivityTime,
  getRelativeActivityTime,
  resourceTypeLabel,
  toRfc3339EndOfDay,
  toRfc3339StartOfDay,
} from "../../../lib/activityLogDisplay"
import { cn } from "../../../lib/utils"
import { EXPORT_PERMISSIONS, EXPORT_ROUTES } from "../../../lib/csv-export"
import { activityLogExportQuery } from "../../../lib/csvExportFilters"
import { TABLE_PAGE_SIZE_OPTIONS } from "../../../lib/tablePagination"
import type { ActivityLog, ActivityLogFilters } from "../../../types/activity-log.types"
import { ActorCell, ActorLabel } from "./ActorLabel"
import { ActorHoverCard } from "./ActorHoverCard"

export interface ActivityLogListPanelProps {
  /** When set, locks the list to actions by this actor (user profile audit tab). */
  fixedActorId?: number
  compact?: boolean
  showStats?: boolean
  /** Enable horizontal scroll for embedded/narrow layouts (e.g. user profile). */
  scrollable?: boolean
}

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

function truncateUA(ua: string): string {
  if (ua.length <= 48) return ua
  return `${ua.substring(0, 45)}…`
}

export function ActivityLogListPanel({
  fixedActorId,
  compact = false,
  showStats = !compact,
  scrollable = false,
}: ActivityLogListPanelProps) {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const [actionFilter, setActionFilter] = useState("")
  const [resourceTypeFilter, setResourceTypeFilter] = useState("")
  const [resourceIdFilter, setResourceIdFilter] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateAfter, setDateAfter] = useState("")
  const [dateBefore, setDateBefore] = useState("")

  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const serverFilters = useMemo((): ActivityLogFilters => {
    const offset = (page - 1) * pageSize
    const filters: ActivityLogFilters = { limit: pageSize, offset }
    if (fixedActorId != null) filters.actor_id = fixedActorId
    if (actionFilter) filters.action = actionFilter
    if (resourceTypeFilter) filters.resource_type = resourceTypeFilter
    const resourceId = Number(resourceIdFilter)
    if (resourceIdFilter.trim() && Number.isFinite(resourceId) && resourceId > 0) {
      filters.resource_id = resourceId
    }
    if (dateAfter) filters.after = toRfc3339StartOfDay(dateAfter)
    if (dateBefore) filters.before = toRfc3339EndOfDay(dateBefore)
    return filters
  }, [
    page,
    pageSize,
    fixedActorId,
    actionFilter,
    resourceTypeFilter,
    resourceIdFilter,
    dateAfter,
    dateBefore,
  ])

  const exportParams = useMemo(
    () => activityLogExportQuery(serverFilters),
    [serverFilters],
  )

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getActivityLogs(serverFilters)
      setLogs(data.logs)
      setTotalCount(data.total_count)
    } catch (e) {
      console.error("Failed to fetch activity logs:", e)
      setLogs([])
      setTotalCount(0)
      const msg = getApiErrorMessage(e, "Failed to load activity logs")
      setError(msg)
      notifyApiError(e, "Failed to load activity logs")
    } finally {
      setLoading(false)
    }
  }, [serverFilters])

  useEffect(() => {
    void fetchLogs()
  }, [fetchLogs])

  useEffect(() => {
    setPage(1)
  }, [actionFilter, resourceTypeFilter, resourceIdFilter, dateAfter, dateBefore, fixedActorId, pageSize])

  const handleViewDetail = async (logId: number) => {
    setDialogOpen(true)
    setDetailLoading(true)
    setSelectedLog(null)
    try {
      const log = await getActivityLogById(logId)
      setSelectedLog(log)
    } catch (e) {
      console.error("Failed to fetch log detail:", e)
      notifyApiError(e, "Failed to load log detail")
      setDialogOpen(false)
    } finally {
      setDetailLoading(false)
    }
  }

  const clearFilters = () => {
    setActionFilter("")
    setResourceTypeFilter("")
    setResourceIdFilter("")
    setDateAfter("")
    setDateBefore("")
    setSearchQuery("")
    setPage(1)
  }

  const activeFilterCount = countActiveFilters([
    { value: actionFilter },
    { value: resourceTypeFilter },
    { value: resourceIdFilter },
    { value: dateAfter },
    { value: dateBefore },
  ])

  const hasActiveFilters = activeFilterCount > 0 || Boolean(searchQuery.trim())

  const filteredLogs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return logs
    return logs.filter((log) => {
      const haystack = [
        log.message,
        log.action,
        log.actor_name,
        log.actor_email,
        log.actor_role,
        log.resource_type,
        log.resource_id != null ? String(log.resource_id) : "",
        JSON.stringify(log.metadata ?? {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [logs, searchQuery])

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, pageCount)
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, totalCount)
  const showActorColumn = fixedActorId == null
  const columnCount = showActorColumn ? 6 : 5

  return (
    <div className={cn("space-y-4", scrollable && "min-w-0")}>
      {!compact ? (
        <div className="flex items-center justify-end gap-2">
          <ExportCsvButton
            permission={EXPORT_PERMISSIONS.activityLogs}
            exportPath={EXPORT_ROUTES.activityLogs}
            params={exportParams}
            disabled={loading}
          />
          <Button variant="outline" className="gap-2" disabled={loading} onClick={() => void fetchLogs()}>
            {loading ? <SpinnerIcon className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
        </div>
      ) : (
        <div className="flex justify-end">
          <ExportCsvButton
            permission={EXPORT_PERMISSIONS.activityLogs}
            exportPath={EXPORT_ROUTES.activityLogs}
            params={exportParams}
            disabled={loading}
            size="sm"
          />
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {showStats ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-600">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-grayScale-600">{totalCount.toLocaleString()}</p>
              <p className="text-xs text-grayScale-400">Matching entries</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-grayScale-600">
                {logs[0]?.created_at ? getRelativeActivityTime(logs[0].created_at) : "—"}
              </p>
              <p className="text-xs text-grayScale-400">Latest on this page</p>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-600">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-grayScale-600">{filteredLogs.length}</p>
              <p className="text-xs text-grayScale-400">Rows after search (this page)</p>
            </div>
          </div>
        </div>
      ) : null}

      <ExportTruncationWarning totalCount={totalCount} />

      <AdminFiltersPanel activeFilterCount={activeFilterCount} onClearFilters={clearFilters}>
        {!compact ? (
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search message, action, or metadata on this page…"
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="h-9 max-w-[220px] appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Action: All</option>
              {ACTION_FILTER_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.actions.map((action) => (
                    <option key={action} value={action}>
                      {actionLabel(action)}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
          </div>

          <div className="relative">
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="h-9 max-w-[200px] appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Resource: All</option>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
          </div>

          {!fixedActorId ? (
            <Input
              type="number"
              min={1}
              placeholder="Resource ID"
              value={resourceIdFilter}
              onChange={(e) => setResourceIdFilter(e.target.value)}
              className="h-9 w-28"
            />
          ) : null}

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-grayScale-400">From</label>
            <input
              type="date"
              value={dateAfter}
              onChange={(e) => setDateAfter(e.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-grayScale-400">To</label>
            <input
              type="date"
              value={dateBefore}
              onChange={(e) => setDateBefore(e.target.value)}
              className="h-9 rounded-md border bg-white px-3 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>
        </div>
      </AdminFiltersPanel>

      <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
        <div
          className={cn(
            scrollable && "min-w-0 w-full max-w-full overflow-x-auto",
          )}
        >
          <Table
            noWrapper={scrollable}
            className={cn(scrollable && "min-w-[920px]")}
          >
          <TableHeader>
            <TableRow>
              <TableHead className={cn(scrollable && "whitespace-nowrap")}>Action</TableHead>
              <TableHead className={cn(scrollable && "whitespace-nowrap")}>Message</TableHead>
              {showActorColumn ? (
                <TableHead className={cn(scrollable && "whitespace-nowrap")}>Actor</TableHead>
              ) : null}
              <TableHead className={cn(scrollable && "whitespace-nowrap")}>Resource</TableHead>
              <TableHead className={cn(scrollable && "whitespace-nowrap")}>Time</TableHead>
              <TableHead className={cn("text-right", scrollable && "whitespace-nowrap")}>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon className="h-6 w-6 text-brand-500" />
                    <span className="text-sm text-grayScale-400">Loading activity logs…</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Activity className="h-8 w-8 text-grayScale-200" />
                    <div>
                      <p className="text-sm font-medium text-grayScale-500">No activity logs found</p>
                      <p className="mt-1 text-xs text-grayScale-400">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Activity will appear here once actions are performed"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => (
                <TableRow key={log.id} className="group">
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                        actionBadgeClasses(log.action),
                      )}
                    >
                      {actionLabel(log.action)}
                    </span>
                  </TableCell>
                  <TableCell className={cn(scrollable && "whitespace-nowrap")}>
                    <p
                      className={cn(
                        "text-sm text-grayScale-600",
                        scrollable ? "whitespace-nowrap" : "max-w-[280px] truncate",
                      )}
                    >
                      {log.message || "—"}
                    </p>
                  </TableCell>
                  {showActorColumn ? (
                    <TableCell className={cn(scrollable && "whitespace-nowrap")}>
                      <ActorHoverCard log={log}>
                        <ActorCell log={log} />
                      </ActorHoverCard>
                    </TableCell>
                  ) : null}
                  <TableCell className={cn(scrollable && "whitespace-nowrap")}>
                    <ResourceCell log={log} />
                  </TableCell>
                  <TableCell className={cn(scrollable && "whitespace-nowrap")}>
                    <div>
                      <p className="text-sm text-grayScale-600">{formatActivityDate(log.created_at)}</p>
                      <p className="text-xs text-grayScale-400" title={formatActivityTime(log.created_at)}>
                        {getRelativeActivityTime(log.created_at)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className={cn("text-right", scrollable && "whitespace-nowrap")}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={() => void handleViewDetail(log.id)}
                    >
                      <Eye className="h-4 w-4 text-grayScale-400" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
          <div className="flex items-center gap-2">
            <span>
              Showing {startEntry}–{endEntry} of {totalCount}
            </span>
            <span className="hidden h-4 w-px bg-grayScale-200 sm:inline" />
            <span className="hidden sm:inline">Rows per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
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
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={safePage <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Previous
            </Button>
            <span className="text-xs text-grayScale-500">
              Page {safePage} of {pageCount}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={safePage >= pageCount || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-brand-500" />
              Activity log detail
            </DialogTitle>
            <DialogDescription>Full audit entry including request context and metadata.</DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <SpinnerIcon className="h-6 w-6" />
            </div>
          ) : selectedLog ? (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    actionBadgeClasses(selectedLog.action),
                  )}
                >
                  {actionLabel(selectedLog.action)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  ID #{selectedLog.id}
                </Badge>
              </div>

              {selectedLog.message ? (
                <div className="rounded-lg bg-grayScale-50 p-3">
                  <p className="text-sm text-grayScale-600">{selectedLog.message}</p>
                </div>
              ) : null}

              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="Actor"
                  value={<ActorLabel log={selectedLog} linkToProfile />}
                />
                <DetailItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Role"
                  value={
                    selectedLog.actor_role ? formatRoleLabel(selectedLog.actor_role) : "—"
                  }
                />
                <DetailItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Resource"
                  value={
                    <ResourceCell log={selectedLog} linkInDetail />
                  }
                />
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={`${formatActivityDate(selectedLog.created_at)} ${formatActivityTime(selectedLog.created_at)}`}
                />
                <DetailItem
                  icon={<Globe className="h-4 w-4" />}
                  label="IP address"
                  value={selectedLog.ip_address || "—"}
                />
                <DetailItem
                  icon={<Monitor className="h-4 w-4" />}
                  label="User agent"
                  value={
                    selectedLog.user_agent ? truncateUA(selectedLog.user_agent) : "—"
                  }
                  title={selectedLog.user_agent ?? undefined}
                />
              </div>

              {Object.keys(selectedLog.metadata ?? {}).length > 0 ? (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-grayScale-400">
                    Technical details
                  </p>
                  <div className="rounded-lg border bg-grayScale-50 p-3">
                    <pre className="whitespace-pre-wrap break-words font-mono text-xs text-grayScale-600">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ResourceCell({
  log,
  linkInDetail = false,
}: {
  log: Pick<ActivityLog, "resource_type" | "resource_id">
  linkInDetail?: boolean
}) {
  const path = activityLogResourcePath(log.resource_type, log.resource_id)
  const label = `${resourceTypeLabel(log.resource_type)}${
    log.resource_id != null ? ` #${log.resource_id}` : ""
  }`

  if (path && log.resource_id != null) {
    return (
      <Link
        to={path}
        className={cn(
          "text-sm font-medium text-brand-600 hover:text-brand-700",
          linkInDetail ? "inline" : "block",
        )}
      >
        {label}
      </Link>
    )
  }

  return (
    <div>
      <p className="text-sm text-grayScale-600">{resourceTypeLabel(log.resource_type)}</p>
      {log.resource_id != null ? (
        <p className="text-xs text-grayScale-400">#{log.resource_id}</p>
      ) : null}
    </div>
  )
}

function DetailItem({
  icon,
  label,
  value,
  title,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  title?: string
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-white p-2.5">
      <div className="mt-0.5 text-grayScale-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-grayScale-400">{label}</p>
        <p className="truncate text-sm font-medium text-grayScale-600" title={title}>
          {value}
        </p>
      </div>
    </div>
  )
}
