import { Search } from "lucide-react"
import { Input } from "../../../components/ui/input"
import { Select } from "../../../components/ui/select"
import type { PublishStatusFilter } from "../../../lib/contentListFilters"
import { cn } from "../../../lib/utils"

type ContentListSearchFilterBarProps = {
  search: string
  onSearchChange: (value: string) => void
  publishStatusFilter: PublishStatusFilter
  onPublishStatusFilterChange: (value: PublishStatusFilter) => void
  searchPlaceholder?: string
  searchAriaLabel?: string
  className?: string
}

export function ContentListSearchFilterBar({
  search,
  onSearchChange,
  publishStatusFilter,
  onPublishStatusFilterChange,
  searchPlaceholder = "Search by name or description…",
  searchAriaLabel = "Search content",
  className,
}: ContentListSearchFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-3 rounded-xl border border-grayScale-100 bg-white p-4 shadow-sm",
        className,
      )}
    >
      <div className="relative min-w-[200px] flex-1">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400"
          aria-hidden
        />
        <Input
          className="pl-9"
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label={searchAriaLabel}
        />
      </div>
      <Select
        className="w-full sm:w-48 sm:shrink-0"
        value={publishStatusFilter}
        onChange={(e) =>
          onPublishStatusFilterChange(e.target.value as PublishStatusFilter)
        }
        aria-label="Filter by publish status"
      >
        <option value="all">All statuses</option>
        <option value="PUBLISHED">Published</option>
        <option value="DRAFT">Draft</option>
      </Select>
    </div>
  )
}
