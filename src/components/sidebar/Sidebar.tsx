import {
  BarChart3,
  Bell,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
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
import { BrandLogo } from "../brand/BrandLogo";
import { getUnreadCount } from "../../api/notifications.api";
import { useTeamPermissions } from "../../hooks/useTeamPermissions";
import { hasFaqPermission } from "../../lib/faqPermissions";
import { hasRatingsPermission } from "../../lib/ratingsPermissions";
import { hasPersonaPermission } from "../../lib/personasPermissions";
import { SidebarNavGroup } from "./SidebarNavGroup";

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
      { label: "Email templates", to: "/notifications/email-templates" },
      { label: "Send notification", to: "/notifications/create" },
      { label: "Scheduled", to: "/notifications/scheduled" },
    ],
  },

  { kind: "section", label: "Operations" },
  { kind: "link", label: "Payments", to: "/payments", icon: CreditCard },
  { kind: "link", label: "User activity log", to: "/user-log", icon: ClipboardList },
  { kind: "link", label: "Issue reports", to: "/issues", icon: CircleAlert },
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
  const { permissions, hasPermission, loading: permissionsLoading } = useTeamPermissions();
  const [unreadCount, setUnreadCount] = useState(0);

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
          "group fixed left-0 top-0 z-50 flex h-screen flex-col border-r bg-grayScale-50 py-5 transition-all duration-300",
          "w-[264px] px-4 lg:translate-x-0",
          isCollapsed && "lg:w-[88px] lg:px-2",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div
          className={cn(
            "flex items-center justify-between px-2",
            isCollapsed && "justify-center",
          )}
        >
          {isCollapsed ? (
            <span className="h-10 w-10 overflow-hidden">
              <BrandLogo className="h-10 w-auto max-w-none" />
            </span>
          ) : (
            <BrandLogo />
          )}
          <button
            type="button"
            className={cn(
              "hidden h-8 w-8 place-items-center rounded-lg text-grayScale-500 transition-opacity hover:bg-grayScale-100 hover:text-brand-600 lg:grid lg:opacity-0 lg:pointer-events-none lg:group-hover:opacity-100 lg:group-hover:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto",
              isCollapsed && "translate-x-2",
            )}
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {isCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
          <button
            type="button"
            className="grid h-8 w-8 place-items-center rounded-lg text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600 lg:hidden"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-6 flex-1 space-y-0.5 overflow-y-auto">
          {navEntries.map((entry, index) => {
            if (entry.kind === "section") {
              if (isCollapsed) {
                return index > 0 ? (
                  <div
                    key={`section-gap-${entry.label}`}
                    className="mx-auto my-2 h-px w-6 bg-grayScale-200"
                    aria-hidden
                  />
                ) : null;
              }
              return (
                <p
                  key={`section-${entry.label}`}
                  className={cn(
                    "mb-1 px-3 pt-3 text-[10px] font-bold uppercase tracking-wider text-grayScale-400",
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
                entry.permission &&
                entry.permission !== "faqs.list" &&
                entry.permission !== "ratings.list_by_target" &&
                entry.permission !== "personas.list" &&
                !permissionsLoading &&
                !hasPermission(entry.permission)
              ) {
                return null;
              }
            }

            if (entry.kind === "group") {
              const isNotifications = entry.basePath === "/notifications";
              return (
                <SidebarNavGroup
                  key={entry.basePath}
                  label={entry.label}
                  icon={entry.icon}
                  basePath={entry.basePath}
                  activePaths={entry.activePaths}
                  children={entry.children}
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
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-grayScale-600 transition",
                    isCollapsed && "justify-center px-2",
                    "hover:bg-grayScale-100 hover:text-brand-600",
                    isActive &&
                      "bg-brand-100/40 text-brand-600 shadow-[0_1px_0_rgba(0,0,0,0.02)] ring-1 ring-brand-100",
                  )
                }
                title={isCollapsed ? entry.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn(
                        "grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition group-hover:bg-brand-100 group-hover:text-brand-600",
                        isActive && "bg-brand-500/90 text-white",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    {!isCollapsed && (
                      <span className="truncate">{entry.label}</span>
                    )}
                    {!isCollapsed && isActive ? (
                      <span className="ml-auto h-6 w-1 rounded-full bg-brand-500/80" />
                    ) : null}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="px-2 pt-6">
          <button
            type="button"
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className={cn(
              "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600",
              isCollapsed && "justify-center px-2",
            )}
            title={isCollapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4" />
            {!isCollapsed && "Logout"}
          </button>
        </div>
      </aside>
    </>
  );
}
