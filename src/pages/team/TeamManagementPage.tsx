import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel";
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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { ToggleSwitch } from "../../components/ui/toggle-switch";
import { countActiveFilters } from "../../lib/adminFilterUtils";
import { cn } from "../../lib/utils";
import { TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination";
import { getTeamMembers, updateTeamMemberStatus } from "../../api/team.api";
import type { TeamMember } from "../../types/team.types";
import { toast } from "sonner";
import { InviteTeamMemberDialog } from "../role-management/components/InviteTeamMemberDialog";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;
  return formatDate(dateStr);
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case "super_admin":
      return "bg-brand-500/15 text-brand-600 border-brand-500/25";
    case "admin":
      return "bg-brand-100 text-brand-600";
    case "content_manager":
      return "bg-mint-100 text-mint-500";
    case "instructor":
      return "bg-gold-100 text-gold-600";
    case "support_agent":
      return "bg-orange-100 text-orange-600";
    case "finance":
      return "bg-sky-100 text-sky-600";
    case "hr":
      return "bg-pink-100 text-pink-600";
    case "analyst":
      return "bg-violet-100 text-violet-600";
    default:
      return "bg-grayScale-100 text-grayScale-600";
  }
}

function formatRoleLabel(role: string): string {
  return role
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizeFilterValue(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

export function TeamManagementPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toggledStatuses, setToggledStatuses] = useState<Record<number, boolean>>({});
  const [confirmDialog, setConfirmDialog] = useState<{ id: number; name: string; newStatus: string } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);

  const fetchMembers = async () => {
      setLoading(true);
      try {
        const batchSize = 100;
        const firstRes = await getTeamMembers(1, batchSize);
        const firstBatch = firstRes.data.data ?? [];
        const totalPages = firstRes.data.metadata?.total_pages ?? 1;
        let allMembers = firstBatch;
        if (totalPages > 1) {
          const restResponses = await Promise.all(
            Array.from({ length: totalPages - 1 }, (_, idx) => getTeamMembers(idx + 2, batchSize)),
          );
          const restBatches = restResponses.flatMap((res) => res.data.data ?? []);
          allMembers = [...firstBatch, ...restBatches];
        }
        setMembers(allMembers);

        const initialStatuses: Record<number, boolean> = {};
        allMembers.forEach((m) => {
          initialStatuses[m.id] = m.status === "active";
        });
        setToggledStatuses((prev) => ({ ...prev, ...initialStatuses }));
      } catch (error) {
        console.error("Failed to fetch team members:", error);
        setMembers([]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        `${member.first_name} ${member.last_name}`.toLowerCase().includes(q) ||
        member.email.toLowerCase().includes(q);
      const roleValue = normalizeFilterValue(member.team_role || "");
      const statusValue = normalizeFilterValue(member.status || "");
      const matchesRole = !roleFilter || roleValue === normalizeFilterValue(roleFilter);
      const matchesStatus = !statusFilter || statusValue === normalizeFilterValue(statusFilter);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter, statusFilter, pageSize]);

  const total = filteredMembers.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);
  const startEntry = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const endEntry = Math.min(safePage * pageSize, total);
  const paginatedMembers = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, safePage, pageSize]);

  const handlePrev = () => safePage > 1 && setPage(safePage - 1);
  const handleNext = () => safePage < pageCount && setPage(safePage + 1);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
    } else {
      pages.push(1, 2, 3, 4);
      if (safePage > 5) pages.push("...");
      if (safePage > 4 && safePage < pageCount - 3) pages.push(safePage);
      if (safePage < pageCount - 4) pages.push("...");
      pages.push(pageCount);
    }
    return pages;
  };

  const handleToggle = (id: number) => {
    const member = members.find((m) => m.id === id);
    if (!member) return;
    const currentlyActive = toggledStatuses[id] ?? false;
    const newStatus = currentlyActive ? "inactive" : "active";
    setConfirmDialog({ id, name: `${member.first_name} ${member.last_name}`, newStatus });
  };

  const handleConfirmStatusUpdate = async () => {
    if (!confirmDialog) return;
    const { id, newStatus, name } = confirmDialog;
    const previousActive = toggledStatuses[id] ?? false;
    setUpdating(true);
    setToggledStatuses((prev) => ({ ...prev, [id]: newStatus === "active" }));
    try {
      await updateTeamMemberStatus(id, newStatus);
      setMembers((prev) =>
        prev.map((member) => (member.id === id ? { ...member, status: newStatus } : member)),
      );
      toast.success(
        `${name || "Team member"} ${newStatus === "active" ? "activated" : "deactivated"} successfully`,
      );
    } catch (error) {
      console.error("Failed to update member status:", error);
      setToggledStatuses((prev) => ({ ...prev, [id]: previousActive }));
      toast.error("Failed to update team member status. Please try again.");
    } finally {
      setUpdating(false);
      handleCancelConfirm();
    }
  };

  const handleCancelConfirm = () => {
    setConfirmDialog(null);
  };

  const activeFilterCount = countActiveFilters([
    { value: roleFilter },
    { value: statusFilter },
  ]);

  const clearFilters = () => {
    setRoleFilter("");
    setStatusFilter("");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">Team Management</h1>
          <p className="text-sm text-grayScale-400">
            Manage user access, roles, and platform permissions.
          </p>
        </div>
        <Button
          className="bg-brand-600 hover:bg-brand-500 text-white w-full sm:w-auto"
          onClick={() => setInviteOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <AdminFiltersPanel
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
        search={
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
            <Input
              placeholder="Search by name or email address..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="h-9 appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Role: All</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="content_manager">Content Manager</option>
              <option value="instructor">Instructor</option>
              <option value="support_agent">Support Agent</option>
              <option value="finance">Finance</option>
              <option value="hr">HR</option>
              <option value="analyst">Analyst</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-9 appearance-none rounded-md border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-1 focus:ring-brand-500"
            >
              <option value="">Status: All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
          </div>
        </div>
      </AdminFiltersPanel>

      <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>USER</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead className="hidden md:table-cell">DEPARTMENT</TableHead>
              <TableHead className="hidden lg:table-cell">JOB TITLE</TableHead>
              <TableHead className="hidden sm:table-cell">LAST LOGIN</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-grayScale-400">
                  Loading team members...
                </TableCell>
              </TableRow>
            ) : filteredMembers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-grayScale-500">No team members found</p>
                    <p className="text-xs text-grayScale-400">Try adjusting your filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedMembers.map((member) => {
                const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();
                const isActive = toggledStatuses[member.id] ?? false;

                return (
                  <TableRow
                    key={member.id}
                    className="group cursor-pointer"
                    onClick={() => navigate(`/team/${member.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage
                            src={undefined}
                            alt={`${member.first_name} ${member.last_name}`}
                          />
                          <AvatarFallback className="bg-grayScale-200 text-grayScale-500">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-grayScale-600">
                            {member.first_name} {member.last_name}
                          </div>
                          <div className="text-xs text-grayScale-400">{member.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
                          getRoleBadgeClasses(member.team_role)
                        )}
                      >
                        {formatRoleLabel(member.team_role)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-grayScale-600">
                      {member.department || "—"}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-grayScale-600">
                      {member.job_title || "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {member.last_login ? (
                        <div>
                          <div className="text-sm text-grayScale-600">
                            {formatDate(member.last_login)}
                          </div>
                          <div className="text-xs text-grayScale-400">
                            {getRelativeTime(member.last_login)}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="text-sm text-grayScale-600">Never</div>
                          <div className="text-xs text-grayScale-400">—</div>
                        </div>
                      )}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ToggleSwitch
                        checked={isActive}
                        onCheckedChange={() => handleToggle(member.id)}
                      />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
          <div className="flex items-center gap-2">
            <span>Showing</span>
            <span className="font-medium text-grayScale-600">
              {startEntry}-{endEntry}
            </span>
            <span>of</span>
            <span className="font-medium text-grayScale-600">{total}</span>
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

      {/* Status Update Confirmation Modal */}
      <InviteTeamMemberDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onInvited={() => void fetchMembers()}
      />

      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-grayScale-100 px-4 py-4 sm:px-6">
              <h2 className="text-lg font-semibold text-grayScale-900">Confirm Status Change</h2>
              <button
                onClick={handleCancelConfirm}
                className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-400 transition-colors hover:bg-grayScale-100 hover:text-grayScale-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-6 py-6">
              <p className="text-sm leading-relaxed text-grayScale-600">
                Are you sure you want to change the status of{" "}
                <span className="font-semibold">{confirmDialog.name}</span> to{" "}
                <span className="font-semibold capitalize">{confirmDialog.newStatus}</span>?
              </p>
            </div>
            <div className="flex flex-col-reverse gap-3 border-t border-grayScale-100 px-6 py-4 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleCancelConfirm} disabled={updating}>
                Cancel
              </Button>
              <Button
                className="bg-brand-600 hover:bg-brand-500 text-white"
                onClick={handleConfirmStatusUpdate}
                disabled={updating}
              >
                {updating ? "Updating..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
