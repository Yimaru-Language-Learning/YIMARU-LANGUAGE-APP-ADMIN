export interface LabelCount {
  label: string
  count: number
}

export interface DateCount {
  date: string
  count: number
}

export interface DateRevenue {
  date: string
  revenue: number
}

export interface RevenuePlan {
  label: string
  revenue: number
}

export interface DashboardUsers {
  total_users: number
  new_today: number
  new_week: number
  new_month: number
  by_role: LabelCount[]
  by_status: LabelCount[]
  by_age_group: LabelCount[]
  by_education_level: LabelCount[]
  by_occupation: LabelCount[]
  by_learning_goal: LabelCount[]
  /** API field name (typo preserved to match backend). */
  by_language_challange: LabelCount[]
  by_knowledge_level?: LabelCount[]
  by_country: LabelCount[]
  by_region: LabelCount[]
  registrations_last_30_days: DateCount[]
}

export interface DashboardSubscriptions {
  total_subscriptions: number
  active_subscriptions: number
  new_today: number
  new_week: number
  new_month: number
  by_status: LabelCount[]
  revenue_by_plan: RevenuePlan[]
  new_subscriptions_last_30_days: DateCount[]
}

export interface DashboardPayments {
  total_revenue: number
  avg_transaction_value: number
  total_payments: number
  successful_payments: number
  by_status: LabelCount[]
  by_method: LabelCount[]
  revenue_last_30_days: DateRevenue[]
}

export interface DashboardCoursesLms {
  programs: number
  courses: number
  modules: number
  lessons: number
  lessons_with_video: number
  practices: number
  practices_at_course: number
  practices_at_module: number
  practices_at_lesson: number
}

export interface DashboardCoursesExamPrep {
  catalog_courses: number
  units: number
  unit_modules: number
  lessons: number
  lessons_with_video: number
  lesson_practices: number
}

export interface DashboardCourses {
  total_categories: number
  total_courses: number
  total_sub_courses: number
  total_videos: number
  lms?: DashboardCoursesLms
  exam_prep?: DashboardCoursesExamPrep
}

export interface DashboardContent {
  total_questions: number
  total_question_sets: number
  questions_by_type: LabelCount[]
  question_sets_by_type: LabelCount[]
}

export interface DashboardNotifications {
  total_sent: number
  read_count: number
  unread_count: number
  by_channel: LabelCount[]
  by_type: LabelCount[]
}

export interface DashboardIssues {
  total_issues: number
  resolved_issues: number
  resolution_rate: number
  by_status: LabelCount[]
  by_type: LabelCount[]
}

export interface DashboardTeam {
  total_members: number
  by_role: LabelCount[]
  by_status: LabelCount[]
}

export interface VideoDropOffCheckpoint {
  checkpoint_percent: number
  total_sessions: number
  viewers_reached: number
  drop_off_rate: number
}

export interface DashboardVideos {
  total_watch_sessions: number
  completed_sessions: number
  replay_sessions: number
  unique_video_starts: number
  users_who_replayed: number
  completion_rate: number
  replay_rate: number
  drop_off_by_checkpoint: VideoDropOffCheckpoint[]
}

export type DashboardDateFilterMode = "all_time" | "year" | "year_month" | "custom"

export interface DashboardDateFilter {
  mode: DashboardDateFilterMode
  year?: number
  month?: number
  from?: string
  to?: string
  range_start?: string
  range_end?: string
  series_start?: string
  series_end?: string
  ref_date?: string
}

export type DashboardFilterMode = DashboardDateFilterMode

export interface DashboardFilters {
  mode: DashboardFilterMode
  year?: number
  month?: number
  from?: string
  to?: string
}

export interface DashboardData {
  generated_at: string
  date_filter?: DashboardDateFilter
  users: DashboardUsers
  subscriptions: DashboardSubscriptions
  payments: DashboardPayments
  courses: DashboardCourses
  content: DashboardContent
  notifications: DashboardNotifications
  issues: DashboardIssues
  team: DashboardTeam
  videos?: DashboardVideos
}

export interface DashboardResponse {
  data: DashboardData
}
