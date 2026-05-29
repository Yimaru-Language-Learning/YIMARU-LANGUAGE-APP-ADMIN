import http from "./http";
import type {
  DashboardData,
  DashboardFilters,
  DashboardUsers,
  DateCount,
  LabelCount,
} from "../types/analytics.types";

function buildDashboardQueryParams(filters?: DashboardFilters): Record<string, string | number> {
  if (!filters || filters.mode === "all_time") {
    return {};
  }

  if (filters.mode === "year" && filters.year != null) {
    return { year: filters.year };
  }

  if (filters.mode === "year_month" && filters.year != null && filters.month != null) {
    return { year: filters.year, month: filters.month };
  }

  if (filters.mode === "custom" && filters.from && filters.to) {
    return { from: filters.from, to: filters.to };
  }

  return {};
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function pickField(record: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (key in record && record[key] != null) return record[key];
  }
  return undefined;
}

function asLabelCounts(value: unknown): LabelCount[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const label = String(pickField(item, "label", "Label") ?? "").trim();
      const count = Number(pickField(item, "count", "Count") ?? 0);
      if (!label) return null;
      return { label, count: Number.isFinite(count) ? count : 0 };
    })
    .filter((row): row is LabelCount => row !== null);
}

function asDateCounts(value: unknown): DateCount[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!isRecord(item)) return null;
      const date = String(pickField(item, "date", "Date") ?? "");
      const count = Number(pickField(item, "count", "Count") ?? 0);
      if (!date) return null;
      return { date, count: Number.isFinite(count) ? count : 0 };
    })
    .filter((row): row is DateCount => row !== null);
}

function isDashboardPayload(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) return false;
  return (
    "generated_at" in value ||
    "generatedAt" in value ||
    "users" in value ||
    "Users" in value
  );
}

/** Unwrap `{ data }` / `{ Data }` envelopes until the dashboard object is found. */
function unwrapDashboardPayload(body: unknown): Record<string, unknown> {
  let current: unknown = body;

  for (let depth = 0; depth < 5; depth++) {
    if (!isRecord(current)) break;

    if (isDashboardPayload(current)) {
      const nested = pickField(current, "data", "Data");
      if (isRecord(nested) && isDashboardPayload(nested)) {
        current = nested;
        continue;
      }
      return current;
    }

    const inner = pickField(current, "data", "Data");
    if (inner != null) {
      current = inner;
      continue;
    }

    break;
  }

  return isRecord(current) ? current : {};
}

const EDUCATION_LEVEL_KEYS = ["by_education_level", "byEducationLevel", "ByEducationLevel"] as const;
const OCCUPATION_KEYS = ["by_occupation", "byOccupation", "ByOccupation"] as const;
const LEARNING_GOAL_KEYS = ["by_learning_goal", "byLearningGoal", "ByLearningGoal"] as const;
const LANGUAGE_CHALLENGE_KEYS = [
  "by_language_challange",
  "by_language_challenge",
  "byLanguageChallange",
  "byLanguageChallenge",
  "ByLanguageChallange",
  "ByLanguageChallenge",
] as const;

function normalizeDashboardUsers(raw: unknown, root?: Record<string, unknown>): DashboardUsers {
  const u = isRecord(raw) ? raw : {};
  const scope = root ?? u;

  return {
    total_users: Number(pickField(u, "total_users", "totalUsers", "TotalUsers") ?? 0),
    new_today: Number(pickField(u, "new_today", "newToday", "NewToday") ?? 0),
    new_week: Number(pickField(u, "new_week", "newWeek", "NewWeek") ?? 0),
    new_month: Number(pickField(u, "new_month", "newMonth", "NewMonth") ?? 0),
    by_role: asLabelCounts(pickField(u, "by_role", "byRole", "ByRole")),
    by_status: asLabelCounts(pickField(u, "by_status", "byStatus", "ByStatus")),
    by_age_group: asLabelCounts(pickField(u, "by_age_group", "byAgeGroup", "ByAgeGroup")),
    by_education_level: asLabelCounts(
      pickField(u, ...EDUCATION_LEVEL_KEYS) ?? pickField(scope, ...EDUCATION_LEVEL_KEYS),
    ),
    by_occupation: asLabelCounts(
      pickField(u, ...OCCUPATION_KEYS) ?? pickField(scope, ...OCCUPATION_KEYS),
    ),
    by_learning_goal: asLabelCounts(
      pickField(u, ...LEARNING_GOAL_KEYS) ?? pickField(scope, ...LEARNING_GOAL_KEYS),
    ),
    by_language_challange: asLabelCounts(
      pickField(u, ...LANGUAGE_CHALLENGE_KEYS) ?? pickField(scope, ...LANGUAGE_CHALLENGE_KEYS),
    ),
    by_knowledge_level: asLabelCounts(
      pickField(u, "by_knowledge_level", "byKnowledgeLevel", "ByKnowledgeLevel"),
    ),
    by_country: asLabelCounts(pickField(u, "by_country", "byCountry", "ByCountry")),
    by_region: asLabelCounts(pickField(u, "by_region", "byRegion", "ByRegion")),
    registrations_last_30_days: asDateCounts(
      pickField(
        u,
        "registrations_last_30_days",
        "registrationsLast30Days",
        "RegistrationsLast30Days",
      ),
    ),
  };
}

function normalizeDashboardResponse(body: unknown): DashboardData {
  const root = unwrapDashboardPayload(body);
  const usersRaw = pickField(root, "users", "Users");

  return {
    ...(root as DashboardData),
    users: normalizeDashboardUsers(usersRaw, root),
  };
}

export const getDashboard = (filters?: DashboardFilters) =>
  http
    .get<unknown>("/analytics/dashboard", {
      params: buildDashboardQueryParams(filters),
    })
    .then((res) => ({
      ...res,
      data: normalizeDashboardResponse(res.data),
    }));
