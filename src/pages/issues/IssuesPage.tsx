import { useCallback, useEffect, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Eye,
  RefreshCw,
  Clock,
  User,
  Trash2,
  Info,
  Bug,
  Video,
  BookOpen,
  HelpCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  MessageCircle,
} from "lucide-react";
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { countActiveFilters } from "../../lib/adminFilterUtils";
import { fetchAllOffsetPages } from "../../lib/fetchAllOffsetPages";
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
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination";
import { SpinnerIcon } from "../../components/ui/spinner-icon";
import {
  getIssues,
  getIssueById,
  updateIssueStatus,
  deleteIssue,
  createIssue,
} from "../../api/issues.api";
import type { Issue } from "../../types/issue.types";

// ── Status configuration ───────────────────────────────────────────
const STATUSES = ["pending", "in_progress", "resolved", "closed"] as const;

const ISSUE_TYPES = ["bug", "video", "course", "account", "payment", "other"] as const;

function getStatusConfig(status: string): {
  label: string;
  classes: string;
  icon: typeof CheckCircle2;
} {
  switch (status) {
    case "pending":
      return {
        label: "Pending",
        classes: "bg-amber-50 text-amber-700 border-amber-200",
        icon: Clock,
      };
    case "in_progress":
      return {
        label: "In Progress",
        classes: "bg-blue-50 text-blue-700 border-blue-200",
        icon: Loader2,
      };
    case "resolved":
      return {
        label: "Resolved",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: CheckCircle2,
      };
    case "closed":
      return {
        label: "Closed",
        classes: "bg-grayScale-100 text-grayScale-500 border-grayScale-200",
        icon: XCircle,
      };
    default:
      return {
        label: status,
        classes: "bg-grayScale-100 text-grayScale-600 border-grayScale-200",
        icon: HelpCircle,
      };
  }
}

function getIssueTypeConfig(type: string | null | undefined): {
  label: string;
  classes: string;
  icon: typeof Bug;
} {
  const t = String(type ?? "").trim();
  switch (t) {
    case "bug":
      return {
        label: "Bug",
        classes: "bg-red-50 text-red-700 border-red-200",
        icon: Bug,
      };
    case "video":
      return {
        label: "Video",
        classes: "bg-violet-50 text-violet-700 border-violet-200",
        icon: Video,
      };
    case "course":
      return {
        label: "Course",
        classes: "bg-brand-500 text-white border-brand-500",
        icon: BookOpen,
      };
    case "account":
      return {
        label: "Account",
        classes: "bg-sky-50 text-sky-700 border-sky-200",
        icon: User,
      };
    case "payment":
      return {
        label: "Payment",
        classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: ArrowUpCircle,
      };
    default:
      return {
        label: t ? t.charAt(0).toUpperCase() + t.slice(1) : "Other",
        classes: "bg-grayScale-100 text-grayScale-600 border-grayScale-200",
        icon: HelpCircle,
      };
  }
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
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

function formatRoleLabel(role: string | null | undefined): string {
  const r = String(role ?? "").trim();
  if (!r) return "—";
  return r
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// ── Main Component ─────────────────────────────────────────────────
export function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Detail dialog
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [issueToDelete, setIssueToDelete] = useState<Issue | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Status update
  const [statusUpdating, setStatusUpdating] = useState<number | null>(null);

  // Create issue dialog (admin-created)
  const [createOpen, setCreateOpen] = useState(false);
  const [createSubject, setCreateSubject] = useState("");
  const [createType, setCreateType] = useState<string>("bug");
  const [createDescription, setCreateDescription] = useState("");
  const [createDevice, setCreateDevice] = useState("");
  const [createBrowser, setCreateBrowser] = useState("");
  const [createSubmitting, setCreateSubmitting] = useState(false);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    try {
      const allIssues = await fetchAllOffsetPages(async (offset, limit) => {
        const res = await getIssues({ limit, offset });
        const payload = res.data?.data;
        return {
          items: Array.isArray(payload?.issues) ? payload.issues : [],
          total_count: typeof payload?.total_count === "number" ? payload.total_count : undefined,
        };
      });
      setIssues(allIssues);
    } catch (error) {
      console.error("Failed to fetch issues:", error);
      setIssues([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, typeFilter, pageSize]);

  const handleViewDetail = async (issueId: number) => {
    setDialogOpen(true);
    setDetailLoading(true);
    try {
      const res = await getIssueById(issueId);
      setSelectedIssue(res.data?.data ?? null);
    } catch (error) {
      console.error("Failed to fetch issue detail:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleStatusChange = async (issueId: number, newStatus: string) => {
    setStatusUpdating(issueId);
    try {
      await updateIssueStatus(issueId, newStatus);
      // Update the issue in the list
      setIssues((prev) =>
        prev.map((issue) =>
          issue.id === issueId ? { ...issue, status: newStatus } : issue
        )
      );
      // Also update the detail dialog if it's showing this issue
      if (selectedIssue?.id === issueId) {
        setSelectedIssue((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
    } catch (error) {
      console.error("Failed to update issue status:", error);
    } finally {
      setStatusUpdating(null);
    }
  };

  const handleDeleteClick = (issue: Issue) => {
    setIssueToDelete(issue);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!issueToDelete) return;
    setDeleteLoading(true);
    try {
      await deleteIssue(issueToDelete.id);
      setDeleteDialogOpen(false);
      setIssueToDelete(null);
      // Close detail dialog if the deleted issue was being viewed
      if (selectedIssue?.id === issueToDelete.id) {
        setDialogOpen(false);
        setSelectedIssue(null);
      }
      fetchIssues();
    } catch (error) {
      console.error("Failed to delete issue:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  const activeFilterCount = countActiveFilters([
    { value: statusFilter },
    { value: typeFilter },
  ]);

  const clearFilters = () => {
    setStatusFilter("");
    setTypeFilter("");
    setPage(1);
  };

  // Client-side filtering (status, type, search)
  const filteredIssues = (Array.isArray(issues) ? issues : []).filter((issue) => {
    if (statusFilter && issue.status !== statusFilter) return false;
    if (typeFilter && issue.issue_type !== typeFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const subject = String(issue.subject ?? "").toLowerCase();
      const description = String(issue.description ?? "").toLowerCase();
      const issueType = String(issue.issue_type ?? "").toLowerCase();
      return subject.includes(q) || description.includes(q) || issueType.includes(q);
    }
    return true;
  });

  const totalCount = filteredIssues.length;

  // Pagination
  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, pageCount);
  const paginatedIssues = filteredIssues.slice((safePage - 1) * pageSize, safePage * pageSize);
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

  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, totalCount);

  // Stats
  const pendingCount = issues.filter((i) => i.status === "pending").length;
  const inProgressCount = issues.filter((i) => i.status === "in_progress").length;
  const resolvedCount = issues.filter((i) => i.status === "resolved").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">Issue Reports</h1>
          <p className="text-sm text-grayScale-400">
            Review and manage user-reported issues across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              setPage(1);
              fetchIssues();
            }}
          >
            {loading ? <SpinnerIcon className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
            Refresh
          </Button>
          <Button
            className="gap-2 bg-brand-500 text-white hover:bg-brand-600"
            onClick={() => setCreateOpen(true)}
          >
            <MessageCircle className="h-4 w-4" />
            New Issue
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-600">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{totalCount}</p>
            <p className="text-xs text-grayScale-400">Total Issues</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-600">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{pendingCount}</p>
            <p className="text-xs text-grayScale-400">Pending</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-blue-100 text-blue-600">
            <Loader2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{inProgressCount}</p>
            <p className="text-xs text-grayScale-400">In Progress</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{resolvedCount}</p>
            <p className="text-xs text-grayScale-400">Resolved</p>
          </div>
        </div>
      </div>

      <AdminFiltersPanel
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        summary={
          loading
            ? "Loading…"
            : `${filteredIssues.length} shown · ${totalCount} total`
        }
        search={
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search by subject, description, or type..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Status: All</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {getStatusConfig(s).label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
          </div>

          <div className="relative">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="h-10 appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">Type: All</option>
              {ISSUE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getIssueTypeConfig(t).label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
          </div>
        </div>
      </AdminFiltersPanel>

      {/* Table */}
      <div className="rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SUBJECT</TableHead>
              <TableHead>TYPE</TableHead>
              <TableHead>STATUS</TableHead>
              <TableHead>REPORTER</TableHead>
              <TableHead>CREATED</TableHead>
              <TableHead className="text-right">ACTIONS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <SpinnerIcon className="h-6 w-6" />
                    <span className="text-sm text-grayScale-400">Loading issues...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredIssues.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <AlertCircle className="h-8 w-8 text-grayScale-200" />
                    <div>
                      <p className="text-sm font-medium text-grayScale-500">No issues found</p>
                      <p className="text-xs text-grayScale-400 mt-1">
                        {activeFilterCount > 0 || searchQuery
                          ? "Try adjusting your filters or search query"
                          : "Reported issues will appear here"}
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedIssues.map((issue) => {
                const typeConfig = getIssueTypeConfig(issue.issue_type);
                const statusConfig = getStatusConfig(issue.status);
                const TypeIcon = typeConfig.icon;

                return (
                  <TableRow key={issue.id} className="group">
                    <TableCell>
                      <div className="flex items-start gap-3 max-w-[300px]">
                        <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-50 text-grayScale-400 group-hover:bg-brand-500 group-hover:text-white transition-colors">
                          <TypeIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-grayScale-600 truncate">
                            {issue.subject?.trim() ? issue.subject : "—"}
                          </p>
                          <p className="text-xs text-grayScale-400 truncate mt-0.5">
                            {issue.description?.trim() ? issue.description : "No description"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          typeConfig.classes
                        )}
                      >
                        {typeConfig.label}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={issue.status}
                          disabled={statusUpdating === issue.id}
                          onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                          className={cn(
                            "h-8 appearance-none rounded-full border pl-3 pr-7 text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
                            statusConfig.classes,
                            statusUpdating === issue.id && "opacity-50 cursor-wait"
                          )}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {getStatusConfig(s).label}
                            </option>
                          ))}
                          {!STATUSES.includes(issue.status as (typeof STATUSES)[number]) && issue.status ? (
                            <option value={issue.status}>{getStatusConfig(issue.status).label}</option>
                          ) : null}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 pointer-events-none opacity-50" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-grayScale-100 text-grayScale-500">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-grayScale-600">
                            User #{issue.user_id}
                          </p>
                          <p className="text-xs text-grayScale-400">
                            {formatRoleLabel(issue.user_role)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm text-grayScale-600">
                          {formatDate(issue.created_at)}
                        </p>
                        <p className="text-xs text-grayScale-400">
                          {getRelativeTime(issue.created_at)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewDetail(issue.id)}
                        >
                          <Eye className="h-4 w-4 text-grayScale-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          onClick={() => handleDeleteClick(issue)}
                        >
                          <Trash2 className="h-4 w-4 text-grayScale-400" />
                        </Button>
                      </div>
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
                {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
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
              Issue Detail
            </DialogTitle>
            <DialogDescription>
              Full details for this reported issue.
            </DialogDescription>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex items-center justify-center py-8">
              <SpinnerIcon className="h-6 w-6" />
            </div>
          ) : selectedIssue ? (
            <div className="space-y-4">
              {/* Subject & badges */}
              <div>
                <h3 className="text-base font-semibold text-grayScale-600 mb-2">
                  {selectedIssue.subject}
                </h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      getIssueTypeConfig(selectedIssue.issue_type).classes
                    )}
                  >
                    {getIssueTypeConfig(selectedIssue.issue_type).label}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium",
                      getStatusConfig(selectedIssue.status).classes
                    )}
                  >
                    {getStatusConfig(selectedIssue.status).label}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    ID #{selectedIssue.id}
                  </Badge>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-lg bg-grayScale-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400 mb-1.5">
                  Description
                </p>
                <p className="text-sm text-grayScale-600 leading-relaxed">
                  {selectedIssue.description}
                </p>
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailItem
                  icon={<User className="h-4 w-4" />}
                  label="Reporter"
                  value={`User #${selectedIssue.user_id}`}
                />
                <DetailItem
                  icon={<Info className="h-4 w-4" />}
                  label="Role"
                  value={formatRoleLabel(selectedIssue.user_role)}
                />
                <DetailItem
                  icon={<Clock className="h-4 w-4" />}
                  label="Created"
                  value={formatDateTime(selectedIssue.created_at)}
                />
                <DetailItem
                  icon={<RefreshCw className="h-4 w-4" />}
                  label="Updated"
                  value={formatDateTime(selectedIssue.updated_at)}
                />
              </div>

              {/* Status changer */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400 mb-2">
                  Update Status
                </p>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map((s) => {
                    const config = getStatusConfig(s);
                    const isActive = selectedIssue.status === s;
                    return (
                      <button
                        key={s}
                        disabled={statusUpdating === selectedIssue.id}
                        onClick={() => handleStatusChange(selectedIssue.id, s)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                          isActive
                            ? cn(config.classes, "ring-2 ring-offset-1 ring-current")
                            : "bg-white text-grayScale-500 border-grayScale-200 hover:bg-grayScale-50",
                          statusUpdating === selectedIssue.id && "opacity-50 cursor-wait"
                        )}
                      >
                        {config.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Metadata */}
              {selectedIssue.metadata &&
                Object.keys(selectedIssue.metadata).length > 0 && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-grayScale-400 mb-2">
                      Metadata
                    </p>
                    <div className="rounded-lg border bg-grayScale-50 p-3">
                      <div className="space-y-1.5">
                        {Object.entries(selectedIssue.metadata).map(([key, value]) => (
                          <div key={key} className="flex items-baseline justify-between gap-4">
                            <span className="text-xs font-medium text-grayScale-400 capitalize">
                              {key.replace(/_/g, " ")}
                            </span>
                            <span className="text-xs text-grayScale-600 font-mono text-right">
                              {String(value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t">
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => {
                    setDialogOpen(false);
                    handleDeleteClick(selectedIssue);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Issue
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Create Issue Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-brand-500" />
              <span>Create admin issue</span>
            </DialogTitle>
            <DialogDescription>
              Log an issue directly from the admin panel so it can be tracked and resolved.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Subject
              </label>
              <Input
                placeholder="Short summary of the issue"
                value={createSubject}
                onChange={(e) => setCreateSubject(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Type
              </label>
              <select
                value={createType}
                onChange={(e) => setCreateType(e.target.value)}
                className="h-10 w-full rounded-lg border bg-white px-3 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {ISSUE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {getIssueTypeConfig(t).label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                Description
              </label>
              <textarea
                className="min-h-[100px] w-full rounded-lg border bg-white px-3 py-2 text-sm text-grayScale-700 placeholder:text-grayScale-400 focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Describe what happened, steps to reproduce, and any context that might help."
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Device (optional)
                </label>
                <Input
                  placeholder="e.g. iPhone 14"
                  value={createDevice}
                  onChange={(e) => setCreateDevice(e.target.value)}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-grayScale-600">
                  Browser (optional)
                </label>
                <Input
                  placeholder="e.g. Safari 17"
                  value={createBrowser}
                  onChange={(e) => setCreateBrowser(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCreateOpen(false);
                setCreateSubject("");
                setCreateDescription("");
                setCreateType("bug");
                setCreateDevice("");
                setCreateBrowser("");
              }}
              disabled={createSubmitting}
            >
              Cancel
            </Button>
            <Button
              className="bg-brand-500 text-white hover:bg-brand-600"
              disabled={createSubmitting || !createSubject.trim() || !createDescription.trim()}
              onClick={async () => {
                if (!createSubject.trim() || !createDescription.trim()) return;
                setCreateSubmitting(true);
                try {
                  const payload: any = {
                    subject: createSubject.trim(),
                    description: createDescription.trim(),
                    issue_type: createType,
                  };
                  const metadata: Record<string, string> = {};
                  if (createDevice.trim()) metadata.device = createDevice.trim();
                  if (createBrowser.trim()) metadata.browser = createBrowser.trim();
                  if (Object.keys(metadata).length > 0) {
                    payload.metadata = metadata;
                  }

                  await createIssue(payload);

                  setCreateOpen(false);
                  setCreateSubject("");
                  setCreateDescription("");
                  setCreateType("bug");
                  setCreateDevice("");
                  setCreateBrowser("");
                  fetchIssues();
                } catch (error) {
                  console.error("Failed to create issue:", error);
                } finally {
                  setCreateSubmitting(false);
                }
              }}
            >
              {createSubmitting ? "Creating..." : "Create Issue"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Issue
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this issue? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {issueToDelete && (
            <div className="rounded-lg bg-red-50 border border-red-100 p-3">
              <p className="text-sm font-medium text-red-700">{issueToDelete.subject}</p>
              <p className="text-xs text-red-500 mt-0.5">Issue #{issueToDelete.id}</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeleteDialogOpen(false);
                setIssueToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="gap-1.5"
              disabled={deleteLoading}
              onClick={handleDeleteConfirm}
            >
              {deleteLoading ? (
                <SpinnerIcon className="h-3.5 w-3.5" />
              ) : (
                <Trash2 className="h-3.5 w-3.5" />
              )}
              {deleteLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
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
