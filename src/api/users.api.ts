import http from "./http";
import type { GetTeamMeResponse } from "../types/team.types";
import {
  type GetUsersResponse,
  type UpdateProfileRequest,
  type UserProfileData,
  type UserProfileResponse,
  type UserSummaryResponse,
  type GetDeletionRequestsParams,
  type GetDeletionRequestsResponse,
  type UserRecentActivityResponse,
  type UserRecentActivityItem,
  type UserRecentActivityData,
} from "../types/user.types";
import type {
  LearningActivityAccess,
  LearningActivityCompletedIds,
  LearningActivityCourse,
  LearningActivityLesson,
  LearningActivityModule,
  LearningActivityProgram,
  LearningActivityUnit,
  UserLearningActivityData,
  UserLearningActivityResponse,
  UserSubscriptionPayment,
  UserSubscriptionRecord,
  UserSubscriptionsData,
  UserSubscriptionsResponse,
} from "../types/userAdmin.types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function optionalString(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

export function normalizeUserProfile(raw: unknown): UserProfileData | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  return {
    id,
    first_name: String(raw.first_name ?? ""),
    last_name: String(raw.last_name ?? ""),
    gender: String(raw.gender ?? ""),
    birth_day: optionalString(raw.birth_day),
    email: String(raw.email ?? ""),
    role: String(raw.role ?? ""),
    age_group: String(raw.age_group ?? ""),
    education_level: String(raw.education_level ?? ""),
    country: String(raw.country ?? ""),
    region: String(raw.region ?? ""),
    nick_name: String(raw.nick_name ?? ""),
    occupation: String(raw.occupation ?? ""),
    learning_goal: String(raw.learning_goal ?? ""),
    language_goal: String(raw.language_goal ?? ""),
    language_challange: String(raw.language_challange ?? ""),
    favoutite_topic: String(raw.favoutite_topic ?? ""),
    email_verified: raw.email_verified === true,
    phone_verified: raw.phone_verified === true,
    status: String(raw.status ?? ""),
    last_login: optionalString(raw.last_login),
    profile_completed: raw.profile_completed === true,
    profile_completion_percentage: Number(raw.profile_completion_percentage) || 0,
    profile_picture_url: String(raw.profile_picture_url ?? ""),
    preferred_language: String(raw.preferred_language ?? ""),
    created_at: String(raw.created_at ?? ""),
    subscription_status: String(raw.subscription_status ?? ""),
  };
}

function normalizeUserRecentActivityItem(raw: unknown): UserRecentActivityItem | null {
  if (!isRecord(raw)) return null;
  const id = String(raw.id ?? "").trim();
  if (!id) return null;

  return {
    id,
    kind: String(raw.kind ?? ""),
    occurred_at: String(raw.occurred_at ?? ""),
    headline: String(raw.headline ?? ""),
  };
}

export function normalizeUserRecentActivity(raw: unknown): UserRecentActivityData | null {
  if (!isRecord(raw)) return null;
  const userId = Number(raw.user_id);
  if (!Number.isFinite(userId)) return null;

  const itemsRaw = raw.items;
  const items = Array.isArray(itemsRaw)
    ? itemsRaw
        .map((entry) => normalizeUserRecentActivityItem(entry))
        .filter((entry): entry is UserRecentActivityItem => entry !== null)
    : [];

  return { user_id: userId, items };
}

function normalizeLearningActivityAccess(raw: unknown): LearningActivityAccess {
  if (!isRecord(raw)) {
    return {
      is_accessible: false,
      is_completed: false,
      completed_count: 0,
      total_count: 0,
      progress_percent: 0,
      progress_percent_precise: 0,
    };
  }

  const reason = optionalString(raw.reason);
  return {
    is_accessible: raw.is_accessible === true,
    is_completed: raw.is_completed === true,
    reason: reason ?? undefined,
    completed_count: Number(raw.completed_count) || 0,
    total_count: Number(raw.total_count) || 0,
    progress_percent: Number(raw.progress_percent) || 0,
    progress_percent_precise: Number(raw.progress_percent_precise) || 0,
  };
}

function normalizeLearningActivityLesson(raw: unknown): LearningActivityLesson | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const moduleId = Number(raw.module_id);
  if (!Number.isFinite(id) || !Number.isFinite(moduleId)) return null;

  return {
    id,
    module_id: moduleId,
    title: String(raw.title ?? ""),
    access: normalizeLearningActivityAccess(raw.access),
  };
}

function normalizeLearningActivityModule(raw: unknown): LearningActivityModule | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const lessonsRaw = raw.lessons;
  const lessons = Array.isArray(lessonsRaw)
    ? lessonsRaw
        .map((entry) => normalizeLearningActivityLesson(entry))
        .filter((entry): entry is LearningActivityLesson => entry !== null)
    : [];

  const programId = Number(raw.program_id);
  const courseId = Number(raw.course_id);
  const unitId = Number(raw.unit_id);

  return {
    id,
    program_id: Number.isFinite(programId) ? programId : undefined,
    course_id: Number.isFinite(courseId) ? courseId : undefined,
    unit_id: Number.isFinite(unitId) ? unitId : undefined,
    name: String(raw.name ?? ""),
    access: normalizeLearningActivityAccess(raw.access),
    lessons,
  };
}

function normalizeLearningActivityUnit(raw: unknown): LearningActivityUnit | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const catalogCourseId = Number(raw.catalog_course_id);
  if (!Number.isFinite(id) || !Number.isFinite(catalogCourseId)) return null;

  const modulesRaw = raw.modules;
  const modules = Array.isArray(modulesRaw)
    ? modulesRaw
        .map((entry) => normalizeLearningActivityModule(entry))
        .filter((entry): entry is LearningActivityModule => entry !== null)
    : [];

  return {
    id,
    catalog_course_id: catalogCourseId,
    name: String(raw.name ?? ""),
    access: normalizeLearningActivityAccess(raw.access),
    modules,
  };
}

function normalizeLearningActivityCourse(raw: unknown): LearningActivityCourse | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const modulesRaw = raw.modules;
  const modules = Array.isArray(modulesRaw)
    ? modulesRaw
        .map((entry) => normalizeLearningActivityModule(entry))
        .filter((entry): entry is LearningActivityModule => entry !== null)
    : undefined;

  const unitsRaw = raw.units;
  const units = Array.isArray(unitsRaw)
    ? unitsRaw
        .map((entry) => normalizeLearningActivityUnit(entry))
        .filter((entry): entry is LearningActivityUnit => entry !== null)
    : undefined;

  const programId = Number(raw.program_id);
  const catalogCourseId = Number(raw.catalog_course_id);

  return {
    id,
    program_id: Number.isFinite(programId) ? programId : undefined,
    catalog_course_id: Number.isFinite(catalogCourseId) ? catalogCourseId : undefined,
    name: String(raw.name ?? ""),
    access: normalizeLearningActivityAccess(raw.access),
    modules,
    units,
  };
}

function normalizeLearningActivityProgram(raw: unknown): LearningActivityProgram | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const coursesRaw = raw.courses;
  const courses = Array.isArray(coursesRaw)
    ? coursesRaw
        .map((entry) => normalizeLearningActivityCourse(entry))
        .filter((entry): entry is LearningActivityCourse => entry !== null)
    : [];

  return {
    id,
    name: String(raw.name ?? ""),
    access: normalizeLearningActivityAccess(raw.access),
    courses,
  };
}

function normalizeCompletedIds(raw: unknown): LearningActivityCompletedIds {
  if (!isRecord(raw)) {
    return { lesson_ids: [], module_ids: [], course_ids: [], program_ids: [] };
  }

  const toIds = (value: unknown) =>
    Array.isArray(value)
      ? value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry))
      : [];

  return {
    lesson_ids: toIds(raw.lesson_ids),
    module_ids: toIds(raw.module_ids),
    course_ids: toIds(raw.course_ids),
    program_ids: toIds(raw.program_ids),
  };
}

export function normalizeUserLearningActivity(raw: unknown): UserLearningActivityData | null {
  if (!isRecord(raw)) return null;
  const userId = Number(raw.user_id);
  if (!Number.isFinite(userId)) return null;

  const lmsRaw = isRecord(raw.lms) ? raw.lms : {};
  const lmsProgressRaw = isRecord(lmsRaw.progress) ? lmsRaw.progress : {};
  const programsRaw = lmsProgressRaw.programs;
  const programs = Array.isArray(programsRaw)
    ? programsRaw
        .map((entry) => normalizeLearningActivityProgram(entry))
        .filter((entry): entry is LearningActivityProgram => entry !== null)
    : [];

  const examPrepRaw = isRecord(raw.exam_prep) ? raw.exam_prep : {};
  const examProgressRaw = isRecord(examPrepRaw.progress) ? examPrepRaw.progress : {};
  const catalogCoursesRaw = examProgressRaw.catalog_courses;
  const catalogCourses = Array.isArray(catalogCoursesRaw)
    ? catalogCoursesRaw
        .map((entry) => normalizeLearningActivityCourse(entry))
        .filter((entry): entry is LearningActivityCourse => entry !== null)
    : [];

  const lmsCompletionsRaw = isRecord(lmsRaw.completions) ? lmsRaw.completions : {};
  const examCompletionsRaw = isRecord(examPrepRaw.completions) ? examPrepRaw.completions : {};

  return {
    user_id: userId,
    lms: {
      completed_ids: normalizeCompletedIds(lmsRaw.completed_ids),
      progress: { programs },
      completions: {
        user_id: Number(lmsCompletionsRaw.user_id) || userId,
        programs: Array.isArray(lmsCompletionsRaw.programs) ? lmsCompletionsRaw.programs : [],
      },
    },
    exam_prep: {
      progress: { catalog_courses: catalogCourses },
      completions: {
        user_id: Number(examCompletionsRaw.user_id) || userId,
        catalog_courses: Array.isArray(examCompletionsRaw.catalog_courses)
          ? examCompletionsRaw.catalog_courses
          : [],
      },
    },
    recent_activity: normalizeUserRecentActivity(raw.recent_activity) ?? undefined,
  };
}

function normalizeUserSubscriptionRecord(raw: unknown): UserSubscriptionRecord | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  const userId = Number(raw.user_id);
  const planId = Number(raw.plan_id);
  if (!Number.isFinite(id) || !Number.isFinite(userId) || !Number.isFinite(planId)) return null;

  return {
    id,
    user_id: userId,
    plan_id: planId,
    plan_name: String(raw.plan_name ?? ""),
    plan_category: String(raw.plan_category ?? ""),
    is_lifetime: raw.is_lifetime === true,
    starts_at: String(raw.starts_at ?? ""),
    expires_at: String(raw.expires_at ?? ""),
    status: String(raw.status ?? ""),
    payment_reference: String(raw.payment_reference ?? ""),
    payment_method: String(raw.payment_method ?? ""),
    auto_renew: raw.auto_renew === true,
    created_at: String(raw.created_at ?? ""),
    duration_value: Number(raw.duration_value) || 0,
    duration_unit: String(raw.duration_unit ?? ""),
    price: Number(raw.price) || 0,
    currency: String(raw.currency ?? ""),
    is_currently_active: raw.is_currently_active === true,
  };
}

function normalizeUserSubscriptionPayment(raw: unknown): UserSubscriptionPayment | null {
  if (!isRecord(raw)) return null;
  const id = Number(raw.id);
  if (!Number.isFinite(id)) return null;

  const planId = Number(raw.plan_id);
  const subscriptionId = Number(raw.subscription_id);

  return {
    id,
    plan_id: Number.isFinite(planId) ? planId : undefined,
    plan_name: optionalString(raw.plan_name) ?? undefined,
    subscription_id: Number.isFinite(subscriptionId) ? subscriptionId : undefined,
    amount: Number(raw.amount) || 0,
    currency: String(raw.currency ?? ""),
    payment_method: optionalString(raw.payment_method) ?? undefined,
    status: String(raw.status ?? ""),
    paid_at: optionalString(raw.paid_at),
    expires_at: optionalString(raw.expires_at),
    created_at: String(raw.created_at ?? ""),
  };
}

export function normalizeUserSubscriptions(raw: unknown): UserSubscriptionsData | null {
  if (!isRecord(raw)) return null;
  const userId = Number(raw.user_id);
  if (!Number.isFinite(userId)) return null;

  const activeByCategoryRaw = isRecord(raw.active_by_category) ? raw.active_by_category : {};
  const active_by_category: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(activeByCategoryRaw)) {
    active_by_category[key] = value === true;
  }

  const mapSubscriptions = (value: unknown) =>
    Array.isArray(value)
      ? value
          .map((entry) => normalizeUserSubscriptionRecord(entry))
          .filter((entry): entry is UserSubscriptionRecord => entry !== null)
      : [];

  const payments = Array.isArray(raw.payments)
    ? raw.payments
        .map((entry) => normalizeUserSubscriptionPayment(entry))
        .filter((entry): entry is UserSubscriptionPayment => entry !== null)
    : [];

  return {
    user_id: userId,
    display_status: String(raw.display_status ?? ""),
    has_active_subscription: raw.has_active_subscription === true,
    active_by_category,
    active_subscriptions: mapSubscriptions(raw.active_subscriptions),
    subscriptions: mapSubscriptions(raw.subscriptions),
    payments,
  };
}

/** Query params for GET /users (RFC3339 for created_* / last_login_*; subscription_status: ACTIVE | PENDING | Unsubscribed | EXPIRED).
 * status: ACTIVE | PENDING | SUSPENDED | DEACTIVATED | INACTIVE (all statuses except ACTIVE).
 */
export interface GetUsersParams {
  page?: number
  page_size?: number
  role?: string
  status?: string
  query?: string
  created_before?: string
  created_after?: string
  country?: string
  region?: string
  subscription_status?: string
  education_level?: string
  occupation?: string
  age_group?: string
  favourite_topic?: string
  language_goal?: string
  learning_goal?: string
  knowledge_level?: string
  plan_id?: number
  plan_category?: string
  auto_renew?: boolean
  has_ever_paid?: boolean
  expires_within_days?: number
  last_login_before?: string
  last_login_after?: string
  days_since_last_login_min?: number
  days_since_last_login_max?: number
  profile_completed?: boolean
  initial_assessment_completed?: boolean
  min_lessons_completed?: number
  min_modules_completed?: number
  min_profile_completion_pct?: number
  device_platform?: string
  has_active_device?: boolean
}

function addOptionalString(
  q: Record<string, string | number | boolean>,
  key: string,
  value: string | undefined,
) {
  const v = value?.trim()
  if (!v) return
  q[key] = v
}

function addOptionalNumber(
  q: Record<string, string | number | boolean>,
  key: string,
  value: number | undefined,
) {
  if (value === undefined || !Number.isFinite(value)) return
  q[key] = value
}

function addOptionalBoolean(
  q: Record<string, string | number | boolean>,
  key: string,
  value: boolean | undefined,
) {
  if (value === undefined) return
  q[key] = value
}

export function buildUsersListQuery(params: GetUsersParams): Record<string, string | number | boolean> {
  const q: Record<string, string | number | boolean> = {}
  if (params.page !== undefined) q.page = params.page
  if (params.page_size !== undefined) q.page_size = params.page_size
  addOptionalString(q, "role", params.role)
  addOptionalString(q, "status", params.status)
  addOptionalString(q, "query", params.query)
  addOptionalString(q, "created_before", params.created_before)
  addOptionalString(q, "created_after", params.created_after)
  addOptionalString(q, "country", params.country)
  addOptionalString(q, "region", params.region)
  addOptionalString(q, "subscription_status", params.subscription_status)
  addOptionalString(q, "education_level", params.education_level)
  addOptionalString(q, "occupation", params.occupation)
  addOptionalString(q, "age_group", params.age_group)
  addOptionalString(q, "favourite_topic", params.favourite_topic)
  addOptionalString(q, "language_goal", params.language_goal)
  addOptionalString(q, "learning_goal", params.learning_goal)
  addOptionalString(q, "knowledge_level", params.knowledge_level)
  addOptionalString(q, "plan_category", params.plan_category)
  addOptionalString(q, "device_platform", params.device_platform)
  addOptionalString(q, "last_login_before", params.last_login_before)
  addOptionalString(q, "last_login_after", params.last_login_after)
  addOptionalNumber(q, "plan_id", params.plan_id)
  addOptionalNumber(q, "expires_within_days", params.expires_within_days)
  addOptionalNumber(q, "days_since_last_login_min", params.days_since_last_login_min)
  addOptionalNumber(q, "days_since_last_login_max", params.days_since_last_login_max)
  addOptionalNumber(q, "min_lessons_completed", params.min_lessons_completed)
  addOptionalNumber(q, "min_modules_completed", params.min_modules_completed)
  addOptionalNumber(q, "min_profile_completion_pct", params.min_profile_completion_pct)
  addOptionalBoolean(q, "auto_renew", params.auto_renew)
  addOptionalBoolean(q, "has_ever_paid", params.has_ever_paid)
  addOptionalBoolean(q, "profile_completed", params.profile_completed)
  addOptionalBoolean(q, "initial_assessment_completed", params.initial_assessment_completed)
  addOptionalBoolean(q, "has_active_device", params.has_active_device)
  return q
}

export const getUsers = (params: GetUsersParams = {}) =>
  http.get<GetUsersResponse>("/users", {
    params: buildUsersListQuery(params),
  });

export type UserStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "PENDING";

export interface UpdateUserStatusRequest {
  user_id: number;
  status: UserStatus;
}

export const updateUserStatus = (payload: UpdateUserStatusRequest) =>
  http.patch("/user/status", payload);

export const getUserById = (id: number) =>
  http.get<UserProfileResponse>(`/user/single/${id}`).then((res) => {
    const body = res.data;
    const user = normalizeUserProfile(body?.data);
    if (!user) {
      throw new Error("Invalid user profile response");
    }
    return {
      ...res,
      data: {
        ...body,
        data: user,
      },
    };
  });

export const getUserRecentActivity = (userId: number) =>
  http.get<UserRecentActivityResponse>(`/admin/users/${userId}/recent-activity`).then((res) => {
    const body = res.data;
    const activity = normalizeUserRecentActivity(body?.data);
    if (!activity) {
      throw new Error("Invalid recent activity response");
    }
    return {
      ...res,
      data: {
        ...body,
        data: activity,
      },
    };
  });

export const getUserLearningActivity = (userId: number) =>
  http.get<UserLearningActivityResponse>(`/admin/users/${userId}/learning-activity`).then((res) => {
    const body = res.data;
    const activity = normalizeUserLearningActivity(body?.data);
    if (!activity) {
      throw new Error("Invalid learning activity response");
    }
    return {
      ...res,
      data: {
        ...body,
        data: activity,
      },
    };
  });

export const getUserSubscriptions = (userId: number) =>
  http.get<UserSubscriptionsResponse>(`/admin/users/${userId}/subscriptions`).then((res) => {
    const body = res.data;
    const subscriptions = normalizeUserSubscriptions(body?.data);
    if (!subscriptions) {
      throw new Error("Invalid user subscriptions response");
    }
    return {
      ...res,
      data: {
        ...body,
        data: subscriptions,
      },
    };
  });

export const getMyProfile = () =>
  http.get<GetTeamMeResponse>("/team/me");

// Best-guess API for creating a new user (admin-side).
// Adjust payload shape or endpoint if backend differs.
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  notes?: string;
}

export const createUser = (payload: CreateUserRequest) =>
  http.post("/users", payload);

export const updateProfile = (data: UpdateProfileRequest) =>
  http.put<UserProfileResponse>("/user", data);

export const getUserSummary = () =>
  http.get<UserSummaryResponse>("/users/summary");

export const getDeletionRequests = (params: GetDeletionRequestsParams) =>
  http.get<GetDeletionRequestsResponse>("/admin/users/deletion-requests", { params });

export const updateUserProfilePicture = (id: number, profilePictureUrl: string) =>
  http.post(`/user/${id}/profile-picture`, {
    profile_picture_url: profilePictureUrl,
  });
