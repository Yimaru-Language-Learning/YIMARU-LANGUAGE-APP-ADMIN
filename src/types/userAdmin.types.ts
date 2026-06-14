import type { UserRecentActivityData } from "./user.types"

/** Shared access/progress block in learning-activity tree nodes */
export interface LearningActivityAccess {
  is_accessible: boolean
  is_completed: boolean
  reason?: string
  completed_count: number
  total_count: number
  progress_percent: number
  progress_percent_precise: number
}

export interface LearningActivityLesson {
  id: number
  module_id: number
  title: string
  access: LearningActivityAccess
}

export interface LearningActivityModule {
  id: number
  program_id?: number
  course_id?: number
  unit_id?: number
  name: string
  access: LearningActivityAccess
  lessons: LearningActivityLesson[]
}

export interface LearningActivityUnit {
  id: number
  catalog_course_id: number
  name: string
  access: LearningActivityAccess
  modules: LearningActivityModule[]
}

export interface LearningActivityCourse {
  id: number
  program_id?: number
  catalog_course_id?: number
  name: string
  access: LearningActivityAccess
  modules?: LearningActivityModule[]
  units?: LearningActivityUnit[]
}

export interface LearningActivityProgram {
  id: number
  name: string
  access: LearningActivityAccess
  courses: LearningActivityCourse[]
}

export interface LearningActivityCompletedIds {
  lesson_ids: number[]
  module_ids: number[]
  course_ids: number[]
  program_ids: number[]
}

export interface UserLearningActivityData {
  user_id: number
  lms: {
    completed_ids: LearningActivityCompletedIds
    progress: {
      programs: LearningActivityProgram[]
    }
    completions: {
      user_id: number
      programs: unknown[]
    }
  }
  exam_prep: {
    progress: {
      catalog_courses: LearningActivityCourse[]
    }
    completions: {
      user_id: number
      catalog_courses: unknown[]
    }
  }
  recent_activity?: UserRecentActivityData
}

export interface UserLearningActivityResponse {
  message: string
  data: UserLearningActivityData
  success: boolean
  status_code: number
  metadata: null
}

export interface UserSubscriptionRecord {
  id: number
  user_id: number
  plan_id: number
  plan_name: string
  plan_category: string
  starts_at: string
  expires_at: string
  status: string
  payment_reference: string
  payment_method: string
  auto_renew: boolean
  created_at: string
  duration_value: number
  duration_unit: string
  price: number
  currency: string
  is_currently_active: boolean
}

export interface UserSubscriptionPayment {
  id: number
  plan_id?: number
  plan_name?: string
  subscription_id?: number
  amount: number
  currency: string
  payment_method?: string
  status: string
  paid_at?: string | null
  expires_at?: string | null
  created_at: string
}

export interface UserSubscriptionsData {
  user_id: number
  display_status: string
  has_active_subscription: boolean
  active_by_category: Record<string, boolean>
  active_subscriptions: UserSubscriptionRecord[]
  subscriptions: UserSubscriptionRecord[]
  payments: UserSubscriptionPayment[]
}

export interface UserSubscriptionsResponse {
  message: string
  data: UserSubscriptionsData
  success: boolean
  status_code: number
  metadata: null
}
