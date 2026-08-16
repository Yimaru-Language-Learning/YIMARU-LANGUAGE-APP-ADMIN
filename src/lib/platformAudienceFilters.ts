import type { GetUsersParams } from "../api/users.api"
import { countActiveFilters } from "./adminFilterUtils"
import { fromDatetimeLocalAppValue } from "./datetime"

export interface PlatformAudienceFilters {
  country: string
  region: string
  createdAfterLocal: string
  createdBeforeLocal: string
  educationLevel: string
  occupation: string
  ageGroup: string
  favouriteTopic: string
  languageGoal: string
  learningGoal: string
  knowledgeLevel: string
  subscriptionStatus: string
  planId: string
  planCategory: string
  autoRenew: string
  hasEverPaid: string
  expiresWithinDays: string
  daysSinceLastLoginMin: string
  daysSinceLastLoginMax: string
  profileCompleted: string
  initialAssessmentCompleted: string
  minLessonsCompleted: string
  minModulesCompleted: string
  minProfileCompletionPct: string
  devicePlatform: string
  hasActiveDevice: string
}

export const EMPTY_PLATFORM_AUDIENCE_FILTERS: PlatformAudienceFilters = {
  country: "",
  region: "",
  createdAfterLocal: "",
  createdBeforeLocal: "",
  educationLevel: "",
  occupation: "",
  ageGroup: "",
  favouriteTopic: "",
  languageGoal: "",
  learningGoal: "",
  knowledgeLevel: "",
  subscriptionStatus: "",
  planId: "",
  planCategory: "",
  autoRenew: "",
  hasEverPaid: "",
  expiresWithinDays: "",
  daysSinceLastLoginMin: "",
  daysSinceLastLoginMax: "",
  profileCompleted: "",
  initialAssessmentCompleted: "",
  minLessonsCompleted: "",
  minModulesCompleted: "",
  minProfileCompletionPct: "",
  devicePlatform: "",
  hasActiveDevice: "",
}

function optionalString(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function optionalBool(value: string): boolean | undefined {
  if (value === "true") return true
  if (value === "false") return false
  return undefined
}

function optionalInt(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  const parsed = Number(trimmed)
  if (!Number.isFinite(parsed) || parsed < 0) return undefined
  return Math.trunc(parsed)
}

export function countPlatformAudienceActiveFilters(filters: PlatformAudienceFilters): number {
  return countActiveFilters(Object.values(filters).map((value) => ({ value, defaultValue: "" })))
}

export function platformAudienceFiltersToGetUsersParams(
  filters: PlatformAudienceFilters,
  extras: Pick<GetUsersParams, "page" | "page_size" | "query"> = { page: 1, page_size: 50 },
): GetUsersParams {
  const country = optionalString(filters.country)
  const region =
    country && country.toLowerCase() !== "ethiopia"
      ? undefined
      : optionalString(filters.region)

  return {
    ...extras,
    country,
    region,
    created_after: fromDatetimeLocalAppValue(filters.createdAfterLocal),
    created_before: fromDatetimeLocalAppValue(filters.createdBeforeLocal),
    education_level: optionalString(filters.educationLevel),
    occupation: optionalString(filters.occupation),
    age_group: optionalString(filters.ageGroup),
    favourite_topic: optionalString(filters.favouriteTopic),
    language_goal: optionalString(filters.languageGoal),
    learning_goal: optionalString(filters.learningGoal),
    knowledge_level: optionalString(filters.knowledgeLevel),
    subscription_status: optionalString(filters.subscriptionStatus),
    plan_id: optionalInt(filters.planId),
    plan_category: optionalString(filters.planCategory),
    auto_renew: optionalBool(filters.autoRenew),
    has_ever_paid: optionalBool(filters.hasEverPaid),
    expires_within_days: optionalInt(filters.expiresWithinDays),
    days_since_last_login_min: optionalInt(filters.daysSinceLastLoginMin),
    days_since_last_login_max: optionalInt(filters.daysSinceLastLoginMax),
    profile_completed: optionalBool(filters.profileCompleted),
    initial_assessment_completed: optionalBool(filters.initialAssessmentCompleted),
    min_lessons_completed: optionalInt(filters.minLessonsCompleted),
    min_modules_completed: optionalInt(filters.minModulesCompleted),
    min_profile_completion_pct: optionalInt(filters.minProfileCompletionPct),
    device_platform: optionalString(filters.devicePlatform),
    has_active_device: optionalBool(filters.hasActiveDevice),
  }
}
