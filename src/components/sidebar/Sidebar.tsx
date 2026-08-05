import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  UserCircle2,
  Users,
  UsersRound,
  Settings,
  Star,
  X,
} from "lucide-react";
import { type ComponentType, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "../../lib/utils";
import { SidebarLogo } from "./SidebarLogo";
import { getUnreadCount } from "../../api/notifications.api";
import { useTeamPermissions } from "../../hooks/useTeamPermissions";
import { hasFaqPermission } from "../../lib/faqPermissions";
import { hasRatingsPermission } from "../../lib/ratingsPermissions";
import { hasPersonaPermission } from "../../lib/personasPermissions";
import { hasActivityLogPermission } from "../../lib/activityLogPermissions";
import { hasExportPermission } from "../../lib/exportPermissions";
import { SidebarNavGroup } from "./SidebarNavGroup";
import { useAdminAccess } from "../../hooks/useAdminAccess";
import { isNavEntryAllowedForTeamRole } from "../../lib/adminAccess";

type NavLinkItem = {
  kind: "link";
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
};

type NavGroupItem = {
  kind: "group";
  label: string;
  basePath: string;
  activePaths?: string[];
  icon: ComponentType<{ className?: string }>;
  children: { label: string; to: string; end?: boolean }[];
};

type NavSectionItem = {
  kind: "section";
  label: string;
};

type NavEntry = NavLinkItem | NavGroupItem | NavSectionItem;

const navEntries: NavEntry[] = [
  { kind: "section", label: "Overview" },
  { kind: "link", label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { kind: "link", label: "Analytics", to: "/analytics", icon: BarChart3 },

  { kind: "section", label: "People" },
  {
    kind: "group",
    label: "Users & access",
    basePath: "/users",
    activePaths: ["/users", "/roles", "/team"],
    icon: Users,
    children: [
      { label: "All users", to: "/users/list" },
      { label: "Roles", to: "/roles" },
      { label: "Team members", to: "/team" },
    ],
  },

  { kind: "section", label: "Learning content" },
  {
    kind: "group",
    label: "Content",
    basePath: "/new-content",
    activePaths: ["/new-content"],
    icon: BookOpen,
    children: [
      { label: "Learning content", to: "/new-content", end: true },
      { label: "Reorder structure", to: "/new-content/reorder" },
      { label: "Question types", to: "/new-content/question-types" },
      { label: "Initial assessment", to: "/new-content/initial-assessment" },
    ],
  },
  {
    kind: "link",
    label: "Personas",
    to: "/personas",
    icon: UsersRound,
    permission: "personas.list",
  },

  { kind: "section", label: "Communications" },
  {
    kind: "group",
    label: "Notifications",
    basePath: "/notifications",
    icon: Bell,
    children: [
      { label: "Inbox", to: "/notifications", end: true },
      { label: "All notifications", to: "/notifications/all" },
      { label: "Email templates", to: "/notifications/email-templates" },
      { label: "Send notification", to: "/notifications/create" },
      { label: "Scheduled", to: "/notifications/scheduled" },
    ],
  },

  { kind: "section", label: "Operations" },
  { kind: "link", label: "Payments", to: "/payments", icon: CreditCard },
  {
    kind: "link",
    label: "Subscriptions export",
    to: "/subscriptions/export",
    icon: CreditCard,
    permission: "subscriptions.export",
  },
  {
    kind: "link",
    label: "Activity log",
    to: "/user-log",
    icon: ClipboardList,
    permission: "activity_logs.list",
  },
  {
    kind: "link",
    label: "FAQs",
    to: "/help/faqs",
    icon: CircleHelp,
    permission: "faqs.list",
  },
  {
    kind: "link",
    label: "App reviews",
    to: "/app-reviews",
    icon: Star,
    permission: "ratings.list_by_target",
  },

  { kind: "section", label: "Account" },
  { kind: "link", label: "Profile", to: "/profile", icon: UserCircle2 },
  { kind: "link", label: "Settings", to: "/settings", icon: Settings },
];

type SidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onClose: () => void;
};

export function Sidebar({
  isOpen,
  isCollapsed,
  onToggleCollapse,
  onClose,
}: SidebarProps) {
  const {
    permissions,
    hasPermission,
    loading: permissionsLoading,
  } = useTeamPermissions();
  const [unreadCount, setUnreadCount] = useState(0);
  const { teamRole: sessionTeamRole } = useAdminAccess();

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await getUnreadCount();
        setUnreadCount(res.data.unread);
      } catch {
        // silently fail
      }
    };

    fetchUnread();

    window.addEventListener("notifications-updated", fetchUnread);
    return () =>
      window.removeEventListener("notifications-updated", fetchUnread);
  }, []);

  const unreadBadge = unreadCount > 0 && (
    <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-white">
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  );

  const collapsedUnreadDot = unreadCount > 0 && (
    <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-destructive" />
  );

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside
        className={cn(
          "group fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-grayScale-200 bg-white py-5 shadow-[inset_-1px_0_0_rgba(0,0,0,0.04)] transition-all duration-300",
          "dark:bg-grayScale-50 dark:border-grayScale-200/20",
          "w-[264px] px-4 lg:translate-x-0",
          isCollapsed && "lg:w-[88px] lg:px-2",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-2",
            isCollapsed && "flex-col items-center gap-2",
          )}
        >
          <SidebarLogo collapsed={isCollapsed} />
          {isCollapsed && (
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-md border border-grayScale-200 text-grayScale-400 transition-all hover:bg-grayScale-100 hover:text-brand-600 dark:border-grayScale-200/20 dark:hover:bg-white/5 dark:hover:text-brand-400"
              onClick={onToggleCollapse}
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
          {!isCollapsed && (
            <button
              type="button"
              className="hidden h-10 w-10 rounded-md place-items-center border border-grayScale-200 text-grayScale-400 transition-all hover:bg-grayScale-100 hover:text-brand-600 lg:grid dark:border-grayScale-200/20 dark:hover:bg-white/5 dark:hover:text-brand-400"
              onClick={onToggleCollapse}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            className="grid h-7 w-7 place-items-center rounded-lg text-grayScale-400 hover:bg-grayScale-100 hover:text-brand-600 lg:hidden dark:hover:bg-white/5 dark:hover:text-brand-400"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto scrollbar-none">
          {navEntries.map((entry, index) => {
            if (
              !isNavEntryAllowedForTeamRole(
                entry.kind === "section"
                  ? { kind: "section", label: entry.label }
                  : entry.kind === "group"
                    ? {
                        kind: "group",
                        label: entry.label,
                        basePath: entry.basePath,
                      }
                    : {
                        kind: "link",
                        label: entry.label,
                        to: entry.to,
                      },
                sessionTeamRole,
              )
            ) {
              return null;
            }

            if (entry.kind === "section") {
              if (isCollapsed) {
                return index > 0 ? (
                  <div
                    key={`section-gap-${entry.label}`}
                    className="mx-auto my-2 h-px w-8 bg-grayScale-200 dark:bg-grayScale-200/20"
                    aria-hidden
                  />
                ) : null;
              }
              return (
                <p
                  key={`section-${entry.label}`}
                  className={cn(
                    "mb-1 px-3 pt-4 text-[11px] font-bold uppercase tracking-[0.08em] text-grayScale-400 dark:text-grayScale-400/70",
                    index === 0 && "pt-0",
                  )}
                >
                  {entry.label}
                </p>
              );
            }

            if (entry.kind === "link") {
              if (
                entry.permission === "faqs.list" &&
                !permissionsLoading &&
                !hasFaqPermission("faqs.list", permissions)
              ) {
                return null;
              }
              if (
                entry.permission === "ratings.list_by_target" &&
                !permissionsLoading &&
                !hasRatingsPermission("ratings.list_by_target", permissions)
              ) {
                return null;
              }
              if (
                entry.permission === "personas.list" &&
                !permissionsLoading &&
                !hasPersonaPermission("personas.list", permissions)
              ) {
                return null;
              }
              if (
                entry.permission === "activity_logs.list" &&
                !permissionsLoading &&
                !hasActivityLogPermission("activity_logs.list", permissions)
              ) {
                return null;
              }
              if (
                entry.permission === "subscriptions.export" &&
                !permissionsLoading &&
                !hasExportPermission("subscriptions.export", permissions)
              ) {
                return null;
              }
              if (
                entry.permission &&
                entry.permission !== "faqs.list" &&
                entry.permission !== "ratings.list_by_target" &&
                entry.permission !== "personas.list" &&
                entry.permission !== "activity_logs.list" &&
                entry.permission !== "subscriptions.export" &&
                !permissionsLoading &&
                !hasPermission(entry.permission)
              ) {
                return null;
              }
            }

            if (entry.kind === "group") {
              const isNotifications = entry.basePath === "/notifications";
              const visibleChildren = entry.children.filter((child) =>
                isNavEntryAllowedForTeamRole(
                  { kind: "link", label: child.label, to: child.to },
                  sessionTeamRole,
                ),
              );
              if (visibleChildren.length === 0) {
                return null;
              }
              return (
                <SidebarNavGroup
                  key={entry.basePath}
                  label={entry.label}
                  icon={entry.icon}
                  basePath={entry.basePath}
                  activePaths={entry.activePaths}
                  children={visibleChildren}
                  isCollapsed={isCollapsed}
                  onNavigate={onClose}
                  trailing={
                    isNotifications
                      ? !isCollapsed
                        ? unreadBadge
                        : collapsedUnreadDot
                      : undefined
                  }
                />
              );
            }

            const Icon = entry.icon;
            return (
              <NavLink
                key={entry.to}
                to={entry.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "relative group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-600 transition",
                    isCollapsed && "justify-center gap-0 p-2",
                    "hover:bg-grayScale-100 hover:text-brand-600 dark:text-grayScale-400 dark:hover:bg-white/5 dark:hover:text-brand-400",
                    isActive &&
                      "bg-brand-500/10 hover:bg-brand-500/10 dark:bg-brand-500/15 dark:hover:bg-brand-500/15",
                    isActive ? "text-[#000] dark:text-white" : "",
                  )
                }
                title={isCollapsed ? entry.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grayScale-50 text-grayScale-500 transition dark:bg-grayScale-200/10 dark:text-grayScale-400",
                        isActive &&
                          "bg-brand-500 text-white dark:bg-brand-500 dark:text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span
                        className={cn(
                          "truncate",
                          isActive ? "text-[#000]/80 dark:text-white" : "",
                        )}
                      >
                        {entry.label}
                      </span>
                    )}
                    {isActive && (
                      <span className="absolute right-1.5 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-brand-500" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div
          className={cn(
            "border-t border-grayScale-200 px-2 pt-4 mt-4 dark:border-grayScale-200/20",
            isCollapsed && "border-t-0 px-0 mt-0 pt-2",
          )}
        >
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-500 transition hover:bg-grayScale-100 hover:text-brand-600 dark:text-grayScale-400 dark:hover:bg-white/5 dark:hover:text-brand-400",
              isCollapsed && "justify-center gap-0 p-2",
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grayScale-50 text-grayScale-500 transition dark:bg-grayScale-200/10 dark:text-grayScale-400">
              <LogOut className="h-4 w-4" />
            </span>
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
