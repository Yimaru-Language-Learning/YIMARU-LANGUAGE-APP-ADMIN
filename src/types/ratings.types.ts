export type RatingTargetType = "app" | "course" | "sub_course"

export interface Rating {
  id: number
  user_id: number
  target_type: RatingTargetType
  target_id: number
  stars: number
  review: string | null
  created_at: string
  updated_at: string
}

export interface RatingSummary {
  total_count: number
  average_stars: number
}

export interface ListRatingsParams {
  target_type: RatingTargetType
  target_id?: number
  limit?: number
  offset?: number
}

export interface RatingSummaryParams {
  target_type: RatingTargetType
  target_id?: number
}

export interface GetRatingsResponse {
  message: string
  data: Rating[]
  success?: boolean
  status_code?: number
}

export interface GetRatingSummaryResponse {
  message: string
  data: RatingSummary
  success?: boolean
  status_code?: number
}

export interface AppReviewsPageData {
  summary: RatingSummary
  reviews: Rating[]
}
