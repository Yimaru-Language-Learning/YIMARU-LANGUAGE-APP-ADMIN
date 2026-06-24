import { useCallback, useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Search,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { fetchAllRatingsByTarget } from "../../api/ratings.api"
import { AdminFiltersPanel } from "../../components/filters/AdminFiltersPanel"
import { Badge } from "../../components/ui/badge"
import { Button } from "../../components/ui/button"
import { Card, CardContent } from "../../components/ui/card"
import { Input } from "../../components/ui/input"
import { Select } from "../../components/ui/select"
import { SpinnerIcon } from "../../components/ui/spinner-icon"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table"
import { useRatingsPermissions } from "../../hooks/useRatingsPermissions"
import { countActiveFilters } from "../../lib/adminFilterUtils"
import {
  fetchReviewerProfiles,
  type ReviewerProfile,
} from "../../lib/ratingUserCache"
import {
  formatAverageStars,
  formatRatingDate,
  reviewTextOrPlaceholder,
} from "../../lib/ratingsDisplay"
import {
  getRatingsApiErrorMessage,
  isRatingsForbiddenError,
} from "../../lib/ratingsErrors"
import { DEFAULT_TABLE_PAGE_SIZE, TABLE_PAGE_SIZE_OPTIONS } from "../../lib/tablePagination"
import { cn } from "../../lib/utils"
import type { Rating, RatingSummary } from "../../types/ratings.types"
import { RatingsAccessDenied } from "./components/RatingsAccessDenied"
import { StarRating } from "./components/StarRating"

type StarsFilter = "all" | "1" | "2" | "3" | "4" | "5"

const APP_TARGET_TYPE = "app" as const
const APP_TARGET_ID = 0

export function AppReviewsPage() {
  const { canList, loading: permissionsLoading } = useRatingsPermissions()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [reviews, setReviews] = useState<Rating[]>([])
  const [summary, setSummary] = useState<RatingSummary>({ total_count: 0, average_stars: 0 })
  const [reviewerProfiles, setReviewerProfiles] = useState<Map<number, ReviewerProfile>>(new Map())
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(DEFAULT_TABLE_PAGE_SIZE)
  const [query, setQuery] = useState("")
  const [starsFilter, setStarsFilter] = useState<StarsFilter>("all")

  const load = useCallback(async () => {
    if (!canList) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(false)
    setPermissionDenied(false)

    try {
      const data = await fetchAllRatingsByTarget(APP_TARGET_TYPE, APP_TARGET_ID)
      setSummary(data.summary)
      setReviews(data.reviews)

      const profiles = await fetchReviewerProfiles(data.reviews.map((r) => r.user_id))
      setReviewerProfiles(profiles)
    } catch (e) {
      console.error(e)
      setError(true)
      setReviews([])
      setSummary({ total_count: 0, average_stars: 0 })
      setReviewerProfiles(new Map())
      if (isRatingsForbiddenError(e)) {
        setPermissionDenied(true)
        toast.error(getRatingsApiErrorMessage(e, "You do not have permission to view app reviews"))
      } else {
        toast.error(getRatingsApiErrorMessage(e, "Failed to load app reviews"))
      }
    } finally {
      setLoading(false)
    }
  }, [canList])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [pageSize, starsFilter, query])

  const filteredReviews = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reviews.filter((rating) => {
      if (starsFilter !== "all" && rating.stars !== Number(starsFilter)) return false
      if (!q) return true

      const profile = reviewerProfiles.get(rating.user_id)
      const haystack = [
        rating.review ?? "",
        String(rating.user_id),
        profile?.name ?? "",
        profile?.email ?? "",
      ]
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [reviews, query, starsFilter, reviewerProfiles])

  const activeFilterCount = countActiveFilters([{ value: starsFilter, defaultValue: "all" }])

  const clearFilters = () => {
    setStarsFilter("all")
    setPage(1)
  }

  const totalCount = filteredReviews.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const safePage = Math.min(page, totalPages)
  const paginatedReviews = filteredReviews.slice((safePage - 1) * pageSize, safePage * pageSize)
  const startEntry = totalCount === 0 ? 0 : (safePage - 1) * pageSize + 1
  const endEntry = Math.min(safePage * pageSize, totalCount)

  const writtenOnPage = paginatedReviews.filter((r) => r.review?.trim()).length

  if (!permissionsLoading && !canList) {
    return <RatingsAccessDenied />
  }

  if (permissionDenied) {
    return <RatingsAccessDenied apiForbidden />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-grayScale-600">App Reviews</h1>
          <p className="mt-1 text-sm text-grayScale-400">
            Monitor learner star ratings and written feedback submitted from the app.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          disabled={loading || !canList}
          onClick={() => void load()}
        >
          {loading ? <SpinnerIcon className="h-4 w-4" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-600">
            <Star className="h-5 w-5 fill-amber-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-grayScale-600">
                {formatAverageStars(summary.average_stars)}
              </p>
              <StarRating stars={summary.average_stars} size="sm" />
            </div>
            <p className="text-xs text-grayScale-400">Average rating</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-100 text-brand-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{totalCount}</p>
            <p className="text-xs text-grayScale-400">Total reviews</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border bg-white p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-100 text-emerald-600">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold text-grayScale-600">{writtenOnPage}</p>
            <p className="text-xs text-grayScale-400">With written review (this page)</p>
          </div>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardContent className="space-y-5 pt-5">
          <AdminFiltersPanel
            className="border-0 shadow-none"
            activeFilterCount={activeFilterCount}
            onClearFilters={clearFilters}
            footer="Star and text filters apply across all reviews."
            summary={
              totalCount > 0
                ? `Showing ${startEntry}–${endEntry} of ${totalCount}`
                : "No reviews"
            }
            search={
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-grayScale-400" />
                <Input
                  placeholder="Search review text, user name, email, or ID…"
                  className="pl-9"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            }
            actions={
              <Select
                value={starsFilter}
                onChange={(e) => setStarsFilter(e.target.value as StarsFilter)}
                className="h-9 w-full min-w-[140px] sm:w-40"
                aria-label="Filter by stars"
              >
                <option value="all">All stars</option>
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </Select>
            }
          />

          <div className="min-w-0 overflow-hidden rounded-xl border bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Stars</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead className="w-[200px]">User</TableHead>
                  <TableHead className="w-[140px]">Submitted</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <SpinnerIcon className="h-6 w-6 text-brand-500" />
                        <span className="text-sm text-grayScale-400">Loading reviews…</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center text-sm text-grayScale-500">
                      Failed to load reviews. Try refreshing.
                    </TableCell>
                  </TableRow>
                ) : filteredReviews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Star className="h-8 w-8 text-grayScale-200" />
                        <p className="text-sm font-medium text-grayScale-500">
                          {totalCount === 0
                            ? "No reviews yet"
                            : "No reviews match your filters"}
                        </p>
                        <p className="text-xs text-grayScale-400">
                          {summary.total_count === 0
                            ? "Learners can submit ratings from the mobile or web app."
                            : "Try different filters or search terms."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedReviews.map((rating) => {
                    const profile = reviewerProfiles.get(rating.user_id)
                    return (
                      <TableRow key={rating.id}>
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-2">
                            <StarRating stars={rating.stars} />
                            <Badge variant="outline" className="text-xs">
                              {rating.stars}/5
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md py-3.5">
                          <p
                            className={cn(
                              "text-sm",
                              rating.review?.trim()
                                ? "text-grayScale-600"
                                : "italic text-grayScale-400",
                            )}
                          >
                            {reviewTextOrPlaceholder(rating.review)}
                          </p>
                        </TableCell>
                        <TableCell className="py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600">
                              {(profile?.name ?? `U${rating.user_id}`).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <Link
                                to={`/users/${rating.user_id}`}
                                className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline"
                              >
                                {profile?.name ?? `User #${rating.user_id}`}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                              {profile?.email ? (
                                <p className="truncate text-xs text-grayScale-400">{profile.email}</p>
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-3.5 text-sm text-grayScale-500">
                          {formatRatingDate(rating.created_at)}
                          {rating.updated_at !== rating.created_at ? (
                            <p className="text-xs text-grayScale-400">Updated</p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {canList && totalCount > 0 ? (
            <div className="flex flex-col gap-3 border-t border-grayScale-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-grayScale-500">
                <span>Rows per page</span>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border border-grayScale-200 bg-white px-2 text-sm"
                >
                  {TABLE_PAGE_SIZE_OPTIONS.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Prev
                </Button>
                <span className="text-sm text-grayScale-500">
                  Page {safePage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}
