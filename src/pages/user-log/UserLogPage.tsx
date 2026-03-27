import { useCallback, useEffect, useState } from "react";
import spinnerSrc from "../../assets/Circular-indeterminate progress indicator.svg";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Activity,
  Eye,
  RefreshCw,
  Clock,
  User,
  Globe,
  Monitor,
  FileText,
  X,
  Info,
  Shield,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { cn } from "../../lib/utils";
import { getActivityLogs, getActivityLogById } from "../../api/activity-logs.api";
import type { ActivityLog, ActivityLogFilters } from "../../types/activity-log.types";
import { SpinnerIcon } from "../../components/ui/spinner-icon";

// ── Action type configuration ──────────────────────────────────────
const ACTION_TYPES = [
  "TEAM_MEMBER_CREATED",
  "TEAM_MEMBER_UPDATED",
  "TEAM_MEMBER_DELETED",
  "TEAM_MEMBER_DEACTIVATED",
  "TEAM_MEMBER_REACTIVATED",
  "VIDEO_UPLOADED",
  "VIDEO_DELETED",
  "COURSE_CREATED",
  "COURSE_UPDATED",
  "COURSE_DELETED",
  "USER_REGISTERED",
  "USER_UPDATED",
  "USER_DELETED",
  "ROLE_CREATED",
  "ROLE_UPDATED",
  "ROLE_DELETED",
  "LOGIN",
  "LOGOUT",
] as const;

function getActionBadgeClasses(action: string): string {
  if (action.includes("CREATED") || action.includes("REGISTERED") || action.includes("UPLOADED"))
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (action.includes("UPDATED") || action.includes("REACTIVATED"))
    return "bg-blue-50 text-blue-700 border-blue-200";
  if (action.includes("DELETED") || action.includes("DEACTIVATED"))
    return "bg-red-50 text-red-700 border-red-200";
  if (action.includes("LOGIN") || action.includes("LOGOUT"))
    return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-grayScale-100 text-grayScale-600 border-grayScale-200";
}

function getActionIcon(action: string) {
  if (action.includes("TEAM_MEMBER")) return User;
  if (action.includes("VIDEO")) return FileText;
  if (action.includes("COURSE")) return FileText;
  if (action.includes("ROLE")) return Shield;
  return Activity;
}

function formatActionLabel(action: string): string {
  return action
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Main Component ─────────────────────────────────────────────────
export function UserLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [actionFilter, setActionFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateAfter, setDateAfter] = useState("");
  const [dateBefore, setDateBefore] = useState("");

  // Detail dialog
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const filters: ActivityLogFilters = {
        limit: pageSize,
        offset: (page - 1) * pageSize,
      };
      if (actionFilter) filters.action = actionFilter;
      if (dateAfter) filters.after = new Date(dateAfter).toISOString();
      if (dateBefore) filters.before = new Date(dateBefore).toISOString();

      const res = await getActivityLogs(filters);
      setLogs(res.data.data.logs);
      setTotalCount(res.data.data.total_count);
    } catch (error) {
      console.error("Failed to fetch activity logs:", error);
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, dateAfter, dateBefore]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleViewDetail = async (logId: number) => {
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await getActivityLogById(logId);
      setSelectedLog(res.data.data);
    } catch (error) {
      console.error("Failed to fetch log detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedLog(null);
  };

  const clearFilters = () => {
    setActionFilter("");
    setSearchQuery("");
    setDateAfter("");
    setDateBefore("");
    setPage(1);
  };

  const hasActiveFilters = actionFilter || dateAfter || dateBefore;

  // Pagination
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);

  const handlePrev = () => safePage > 1 && setPage(safePage - 1);
  const handleNext = () => safePage < pageCount && setPage(safePage + 1);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3);
      if (safePage > 4) pages.push("...");
      if (safePage > 3 && safePage < pageCount - 2) pages.push(safePage);
      if (safePage < pageCount - 3) pages.push("...");
      pages.push(pageCount);
    }
    return pages;
  };

  // Filter logs by search (client-side on the message field)
  const filteredLogs = searchQuery
    ? logs.filter(
        (log) =>
          log.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
          log.actor_role?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : logs;

  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, totalCount);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">Activity Log</h1>
          <p className="text-sm text-grayScale-400">
            Track all actions and changes made across the platform.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => {
            setPage(1);
            fetchLogs();
          }}
        >
          {loading ? <SpinnerIcon className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-600">
            <Activity className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{totalCount}</p>
            <p className="text-xs text-grayScale-400">Total Logs</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">
              {logs.length > 0 ? getRelativeTime(logs[0].created_at) : "—"}
            </p>
            <p className="text-xs text-grayScale-400">Latest Activity</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-600">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{filteredLogs.length}</p>
            <p className="text-xs text-grayScale-400">Showing Results</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
          <Input
            placeholder="Search by message, action, or role..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="h-10 appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Action: All</option>
            {ACTION_TYPES.map((action) => (
              <option key={action} value={action}>
                {formatActionLabel(action)}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-grayScale-400">From</label>
          <input
            type="date"
            value={dateAfter}
            onChange={(e) => {
              setDateAfter(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border bg-white px-3 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-grayScale-400">To</label>
          <input
            type="date"
            value={dateBefore}
            onChange={(e) => {
              setDateBefore(e.target.value);
              setPage(1);
            }}
            className="h-10 rounded-lg border bg-white px-3 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1 text-grayScale-400 hover:text-grayScale-600"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ACTION</TableHead>
              <TableHead>MESSAGE</TableHead>
              <TableHead>ACTOR</TableHead>
              <TableHead>RESOURCE</TableHead>
              <TableHead>TIMESTAMP</TableHead>
              <TableHead className="text-right">DETAILS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <img src={spinnerSrc} alt="" className="h-6 w-6 animate-spin" />
                    <span className="text-sm text-grayScale-400">Loading activity logs...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredLogs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Activity className="h-8 w-8 text-grayScale-200" />
                    <div>
                      <p className="text-sm font-medium text-grayScale-500">No activity logs found</p>
                      <p className="text-xs text-grayScale-400 mt-1">
                        {hasActiveFilters
                          ? "Try adjusting your filters"
                          : "Activity will appear here once actions are performed"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredLogs.map((log) => {
                const ActionIcon = getActionIcon(log.action);
                return (
                  <TableRow key={log.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <ActionIcon className="h-4 w-4" />
                        </div>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                            getActionBadgeClasses(log.action)
                          )}
                        >
                          {formatActionLabel(log.action)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-grayScale-600 max-w-[280px] truncate">
                        {log.message || "—"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-grayScale-100 text-grayScale-500">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-grayScale-600">
                            ID: {log.actor_id ?? "System"}
                          </p>
                          {log.actor_role && (
                            <p className="text-xs text-grayScale-400">
                              {formatRoleLabel(log.actor_role)}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-grayScale-600">{log.resource_type}</p>
                        {log.resource_id !== null && (
                          <p className="text-xs text-grayScale-400">#{log.resource_id}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-grayScale-600">{formatDate(log.created_at)}</p>
                        <p className="text-xs text-grayScale-400">
                          {getRelativeTime(log.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleViewDetail(log.id)}
                      >
                        <Eye className="h-4 w-4 text-grayScale-400" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-medium text-grayScale-600">
              {startEntry}–{endEntry}
            </span>
            <span>of</span>
            <span className="font-medium text-grayScale-600">{totalCount}</span>
            <span className="mr-4">entries</span>
            <span className="border-l pl-4">Rows per page</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 appearance-none rounded-md border bg-white pl-2 pr-7 text-sm font-medium text-grayScale-600 focus:outline-none"
              >
                {[5, 10, 20, 30, 50].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handlePrev}
              disabled={safePage === 1}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-md border bg-white text-grayScale-500",
                safePage === 1 && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {getPageNumbers().map((n, idx) =>
              typeof n === "string" ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-grayScale-400">
                  ...
                </span>
              ) : (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={cn(
                    "h-8 w-8 rounded-md border text-sm font-medium",
                    n === safePage
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "bg-white text-grayScale-600 hover:bg-grayScale-50"
                  )}
                >
                  {n}
                </button>
              )
            )}

            <button
              onClick={handleNext}
              disabled={safePage === pageCount}
              className={cn(
                "h-8 w-8 flex items-center justify-center rounded-md border bg-white text-grayScale-500",
                safePage === pageCount && "opacity-50 cursor-not-allowed"
              )}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-brand-500" />
              Activity Log Detail
            </DialogTitle>
            <DialogDescription>
              Full details for this activity log entry.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <SpinnerIcon className="h-6 w-6" />
            </div>
          ) : selectedLog ? (
            <div className="space-y-4">
              {/* Action badge */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
                    getActionBadgeClasses(selectedLog.action)
                  )}
                >
                  {formatActionLabel(selectedLog.action)}
                </span>
                <Badge variant="secondary" className="text-xs">
                  ID #{selectedLog.id}
                </Badge>
              </div>

              {/* Message */}
              {selectedLog.message && (
                <div className="rounded-lg bg-grayScale-50 p-3">
                  <p className="text-sm text-grayScale-600">{selectedLog.message}</p>
                </div>
              )}

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="Actor"
                  value={`ID: ${selectedLog.actor_id ?? "System"}`}
                />
                <DetailItem
                  icon={<Shield className="h-4 w-4" />}
                  label="Role"
                  value={selectedLog.actor_role ? formatRoleLabel(selectedLog.actor_role) : "—"}
                />
                <DetailItem
                  icon={<FileText className="h-4 w-4" />}
                  label="Resource"
                  value={`${selectedLog.resource_type}${selectedLog.resource_id !== null ? ` #${selectedLog.resource_id}` : ""}`}
                />
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={`${formatDate(selectedLog.created_at)} ${formatTime(selectedLog.created_at)}`}
                />
                <DetailItem
                  icon={<Globe className="h-4 w-4" />}
                  label="IP Address"
                  value={selectedLog.ip_address || "—"}
                />
                <DetailItem
                  icon={<Monitor className="h-4 w-4" />}
                  label="User Agent"
                  value={selectedLog.user_agent ? truncateUA(selectedLog.user_agent) : "—"}
                />
              </div>

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400 mb-2">
                    Metadata
                  </p>
                  <div className="rounded-lg border bg-grayScale-50 p-3">
                    <pre className="text-xs text-grayScale-600 whitespace-pre-wrap break-words font-mono">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg border bg-white p-2.5">
      <div className="mt-0.5 text-grayScale-400">{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-grayScale-400">{label}</p>
        <p className="text-sm font-medium text-grayScale-600 truncate" title={value}>
          {value}
        </p>
      </div>
    </div>
  );
}

function truncateUA(ua: string): string {
  if (ua.length <= 40) return ua;
  return ua.substring(0, 37) + "...";
}
