import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Plus,
  ChevronDown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
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
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { getTeamMembers } from "../../api/team.api";
import type { TeamMember } from "../../types/team.types";

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

export function TeamManagementPage() {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [toggledStatuses, setToggledStatuses] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const res = await getTeamMembers(page, pageSize);
        const data = res.data.data;
        setMembers(data);
        setTotal(res.data.metadata.total);

        const initialStatuses: Record<number, boolean> = {};
        data.forEach((m) => {
          initialStatuses[m.id] = m.status === "active";
        });
        setToggledStatuses((prev) => ({ ...prev, ...initialStatuses }));
      } catch (error) {
        console.error("Failed to fetch team members:", error);
        setMembers([]);
        setTotal(0);
      }
    };

    fetchMembers();
  }, [page, pageSize]);

  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, pageCount);

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
    setToggledStatuses((prev) => ({ ...prev, [id]: !prev[id] }));
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
          onClick={() => navigate("/team/add")}
        >
          <Plus className="h-4 w-4" />
          Add Team Member
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-white p-3">
        <div className="relative w-full sm:flex-1 sm:w-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
          <Input
            placeholder="Search by name or email address..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="relative">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
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
            className="h-10 appearance-none rounded-lg border bg-white pl-3 pr-8 text-sm text-grayScale-600 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400 pointer-events-none" />
        </div>

        <Button variant="outline" className="shrink-0">
          <SlidersHorizontal className="h-4 w-4" />
          More Filters
        </Button>
      </div>

      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>USER</TableHead>
              <TableHead>ROLE</TableHead>
              <TableHead className="hidden sm:table-cell">LAST LOGIN</TableHead>
              <TableHead>STATUS</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-grayScale-400">
                  No team members found
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => {
                const initials = `${member.first_name?.[0] ?? ""}${member.last_name?.[0] ?? ""}`.toUpperCase();
                const isActive = toggledStatuses[member.id] ?? false;

                return (
                  <TableRow
                    key={member.id}
                    className="cursor-pointer hover:bg-grayScale-50"
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
                      <button
                        type="button"
                        onClick={() => handleToggle(member.id)}
                        className={cn(
                          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
                          isActive ? "bg-brand-500" : "bg-grayScale-200"
                        )}
                      >
                        <span
                          className={cn(
                            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform",
                            isActive ? "translate-x-5" : "translate-x-0"
                          )}
                        />
                      </button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-3 text-sm text-grayScale-500">
          <div className="flex items-center gap-2">
            <span>Row Per Page</span>
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
            <span>Entries</span>
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
    </div>
  );
}
