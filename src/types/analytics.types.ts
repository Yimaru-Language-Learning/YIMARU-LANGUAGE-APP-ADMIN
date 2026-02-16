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
  by_knowledge_level: LabelCount[]
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

export interface DashboardCourses {
  total_categories: number
  total_courses: number
  total_sub_courses: number
  total_videos: number
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

export interface DashboardData {
  generated_at: string
  users: DashboardUsers
  subscriptions: DashboardSubscriptions
  payments: DashboardPayments
  courses: DashboardCourses
  content: DashboardContent
  notifications: DashboardNotifications
  issues: DashboardIssues
  team: DashboardTeam
}

export interface DashboardResponse {
  data: DashboardData
}
