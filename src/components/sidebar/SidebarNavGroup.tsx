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
            "group flex items-center justify-center rounded-lg px-2 py-2.5 text-sm font-medium text-grayScale-600 transition",
            "hover:bg-grayScale-100 hover:text-brand-600",
            isActive &&
              "bg-brand-100/40 text-brand-600 shadow-[0_1px_0_rgba(0,0,0,0.02)] ring-1 ring-brand-100",
          )
        }
        title={label}
      >
        {({ isActive }) => (
          <span
            className={cn(
              "relative grid h-8 w-8 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition group-hover:bg-brand-100 group-hover:text-brand-600",
              isActive && "bg-brand-500/90 text-white",
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
          "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-grayScale-600 transition",
          "hover:bg-grayScale-100 hover:text-brand-600",
          isSectionActive && "text-brand-600",
        )}
      >
        <span
          className={cn(
            "grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-grayScale-100 text-grayScale-500 transition group-hover:bg-brand-100 group-hover:text-brand-600",
            isSectionActive && "bg-brand-500/90 text-white",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {trailing}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-grayScale-400 transition-transform duration-300 ease-in-out",
            expanded && "rotate-180",
          )}
        />
      </button>

      <div
        id={panelId}
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="ml-4 space-y-0.5 border-l border-grayScale-200 pl-2 pt-0.5 pb-0.5">
            {children.map((child) => (
              <NavLink
                key={child.to}
                to={child.to}
                end={child.end ?? false}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    "block rounded-lg px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-brand-100/40 text-brand-600"
                      : "text-grayScale-500 hover:bg-grayScale-100 hover:text-brand-600",
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
