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

export interface LearnerCourseProgressSummary {
  course_id: number
  learner_user_id: number
  overall_progress_percentage: number
  total_sub_courses: number
  completed_sub_courses: number
  in_progress_sub_courses: number
  not_started_sub_courses: number
  locked_sub_courses: number
}

export interface LearnerCourseProgressSummaryResponse {
  message: string
  data: LearnerCourseProgressSummary
}
