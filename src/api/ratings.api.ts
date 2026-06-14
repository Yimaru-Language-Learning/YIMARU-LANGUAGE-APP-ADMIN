import http from "./http"
import { DEFAULT_TABLE_PAGE_SIZE } from "../lib/tablePagination"
import type {
  AppReviewsPageData,
  GetRatingSummaryResponse,
  GetRatingsResponse,
  ListRatingsParams,
  Rating,
  RatingSummary,
  RatingSummaryParams,
  RatingTargetType,
} from "../types/ratings.types"

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function normalizeTargetId(targetType: RatingTargetType, targetId?: number): number {
  if (targetType === "app") return 0
  const id = Number(targetId ?? 0)
  return Number.isFinite(id) ? id : 0
}

function normalizeRating(raw: unknown): Rating | null {
  if (!isRecord(raw)) return null
  const id = Number(raw.id)
  const user_id = Number(raw.user_id)
  if (!Number.isFinite(id) || !Number.isFinite(user_id)) return null

  const target_type = String(raw.target_type ?? "app") as RatingTargetType
  const stars = Number(raw.stars)
  if (!Number.isFinite(stars) || stars < 1 || stars > 5) return null

  const reviewRaw = raw.review
  const review =
    reviewRaw == null || String(reviewRaw).trim() === "" ? null : String(reviewRaw)

  return {
    id,
    user_id,
    target_type,
    target_id: Number(raw.target_id ?? 0),
    stars,
    review,
    created_at: String(raw.created_at ?? ""),
    updated_at: String(raw.updated_at ?? ""),
  }
}

function parseRatingsList(body: unknown): Rating[] {
  if (isRecord(body) && Array.isArray(body.data)) {
    return body.data.map(normalizeRating).filter((row): row is Rating => row !== null)
  }
  if (Array.isArray(body)) {
    return body.map(normalizeRating).filter((row): row is Rating => row !== null)
  }
  return []
}

function parseRatingSummary(body: unknown): RatingSummary {
  const fallback: RatingSummary = { total_count: 0, average_stars: 0 }
  if (!isRecord(body)) return fallback

  const data = body.data
  if (!isRecord(data)) return fallback

  const total_count = Number(data.total_count ?? 0)
  const average_stars = Number(data.average_stars ?? 0)

  return {
    total_count: Number.isFinite(total_count) ? total_count : 0,
    average_stars: Number.isFinite(average_stars) ? average_stars : 0,
  }
}

function buildRatingsQuery(params: ListRatingsParams): Record<string, string | number> {
  const targetId = normalizeTargetId(params.target_type, params.target_id)
  return {
    target_type: params.target_type,
    target_id: targetId,
    limit: params.limit ?? DEFAULT_TABLE_PAGE_SIZE,
    offset: params.offset ?? 0,
  }
}

export function getRatingSummary(params: RatingSummaryParams) {
  const targetId = normalizeTargetId(params.target_type, params.target_id)
  return http
    .get<GetRatingSummaryResponse>("/ratings/summary", {
      params: { target_type: params.target_type, target_id: targetId },
    })
    .then((res) => parseRatingSummary(res.data))
}

export function listRatingsByTarget(params: ListRatingsParams) {
  return http
    .get<GetRatingsResponse>("/ratings", { params: buildRatingsQuery(params) })
    .then((res) => parseRatingsList(res.data))
}

/** Load summary + paginated reviews in parallel (recommended admin pattern). */
export async function loadRatingsPage(
  targetType: RatingTargetType,
  page: number,
  pageSize: number,
  targetId?: number,
): Promise<AppReviewsPageData> {
  const offset = (page - 1) * pageSize
  const normalizedTargetId = normalizeTargetId(targetType, targetId)

  const [summary, reviews] = await Promise.all([
    getRatingSummary({ target_type: targetType, target_id: normalizedTargetId }),
    listRatingsByTarget({
      target_type: targetType,
      target_id: normalizedTargetId,
      limit: pageSize,
      offset,
    }),
  ])

  return { summary, reviews }
}

/** @deprecated Use listRatingsByTarget — kept for legacy callers. */
export function getRatings(params: {
  target_type: string
  target_id: number
  limit?: number
  offset?: number
}) {
  return listRatingsByTarget({
    target_type: params.target_type as RatingTargetType,
    target_id: params.target_id,
    limit: params.limit,
    offset: params.offset,
  }).then((reviews) => ({
    data: {
      message: "Ratings retrieved successfully",
      data: reviews,
      success: true,
      status_code: 200,
    },
  }))
}
