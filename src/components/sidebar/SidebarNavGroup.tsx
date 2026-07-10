import { ChevronDown } from "lucide-react";
import { type ComponentType, type ReactNode, useEffect, useId, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "../../lib/utils";

export type SidebarNavChild = {
  label: string;
  to: string;
  end?: boolean;
};

type SidebarNavGroupProps = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  basePath: string;
  /** When set, any matching prefix marks the group active (e.g. `/content` and `/new-content`). */
  activePaths?: string[];
  children: SidebarNavChild[];
  isCollapsed: boolean;
  onNavigate?: () => void;
  trailing?: ReactNode;
};

export function SidebarNavGroup({
  label,
  icon: Icon,
  basePath,
  activePaths,
  children,
  isCollapsed,
  onNavigate,
  trailing,
}: SidebarNavGroupProps) {
  const location = useLocation();
  const panelId = useId();
  const paths = activePaths?.length ? activePaths : [basePath];
  const isSectionActive = paths.some((path) => location.pathname.startsWith(path));
  const [expanded, setExpanded] = useState(isSectionActive);

  useEffect(() => {
    if (isSectionActive) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExpanded(true);
    }
  }, [isSectionActive]);

  if (isCollapsed) {
    return (
      <NavLink
        to={children[0]?.to ?? basePath}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            "group flex items-center justify-center rounded-lg p-2 text-sm font-medium text-grayScale-600 transition",
            "hover:bg-grayScale-100 hover:text-brand-600 dark:text-grayScale-400 dark:hover:bg-white/5 dark:hover:text-brand-400",
            isActive &&
              "bg-brand-500/50 text-brand-600 hover:bg-brand-500/50 hover:text-brand-600 dark:bg-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/30 dark:hover:text-brand-400",
          )
        }
        title={label}
      >
        {({ isActive }) => (
          <span
            className={cn(
              "relative flex h-9 w-9 items-center justify-center rounded-lg bg-grayScale-50 text-grayScale-500 transition dark:bg-grayScale-200/10 dark:text-grayScale-400",
              isActive && "bg-brand-500/20 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400",
            )}
          >
            <Icon className="h-4 w-4" />
            {trailing}
          </span>
        )}
      </NavLink>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
        className={cn(
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-grayScale-600 transition",
          "hover:bg-grayScale-100 hover:text-brand-600 dark:text-grayScale-400 dark:hover:bg-white/5 dark:hover:text-brand-400",
          isSectionActive && "text-brand-600 dark:text-brand-400",
        )}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-grayScale-50 text-grayScale-500 transition dark:bg-grayScale-200/10 dark:text-grayScale-400",
            isSectionActive && "bg-brand-500/20 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {trailing}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-grayScale-400 transition-transform duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]",
            expanded && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-[cubic-bezier(0.4,0,0.2,1)]",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-3 space-y-0.5 border-l-2 border-grayScale-100 pl-3 pt-0.5 pb-0.5 dark:border-grayScale-200/20">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end={child.end ?? false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-500/50 text-brand-600 font-medium hover:bg-brand-500/50 hover:text-brand-600 dark:bg-brand-500/30 dark:text-brand-400 dark:hover:bg-brand-500/30 dark:hover:text-brand-400"
                      : "text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600 dark:text-grayScale-400 dark:hover:bg-white/5 dark:hover:text-brand-400",
                  )
                }
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
