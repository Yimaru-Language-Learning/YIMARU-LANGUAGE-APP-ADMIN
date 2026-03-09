export type LearnerCourseProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED"

export interface LearnerCourseProgressItem {
  sub_course_id: number
  title: string
  description?: string | null
  thumbnail?: string | null
  display_order: number
  level: string
  progress_status: LearnerCourseProgressStatus
  progress_percentage: number
  started_at?: string | null
  completed_at?: string | null
  is_locked: boolean
}

export interface LearnerCourseProgressResponse {
  message: string
  data: LearnerCourseProgressItem[]
}
