import assert from "node:assert/strict"
import test from "node:test"
import { getAnalyticsKpiSignature } from "../src/lib/analyticsKpi"
import type { DashboardData } from "../src/types/analytics.types"

function snapshot(): DashboardData {
  return {
    generated_at: "2026-10-08T09:00:00Z",
    date_filter: { mode: "all_time" },
    users: {
      total_users: 100, new_today: 1, new_week: 5, new_month: 10,
      by_role: [], by_status: [], by_age_group: [], by_gender: [],
      by_education_level: [], by_occupation: [], by_learning_goal: [],
      by_language_challange: [], by_country: [], by_region: [],
      registrations_last_30_days: [],
    },
    subscriptions: {
      total_subscriptions: 30, active_subscriptions: 20,
      new_today: 1, new_week: 3, new_month: 6,
      by_status: [{ label: "ACTIVE", count: 20 }, { label: "EXPIRED", count: 10 }],
      revenue_by_plan: [], new_subscriptions_last_30_days: [],
    },
    payments: {
      total_revenue: 6000, avg_transaction_value: 300,
      total_payments: 25, successful_payments: 20,
      by_status: [], by_method: [], revenue_last_30_days: [],
    },
    courses: { total_categories: 2, total_courses: 3, total_sub_courses: 4, total_videos: 50 },
    content: {
      total_questions: 200, total_question_sets: 10,
      questions_by_type: [{ label: "MULTIPLE_CHOICE", count: 150 }, { label: "TEXT", count: 50 }],
      question_sets_by_type: [],
    },
    notifications: { total_sent: 10, read_count: 6, unread_count: 4, by_channel: [], by_type: [] },
    team: { total_members: 5, by_role: [{ label: "ADMIN", count: 5 }], by_status: [] },
  }
}

for (const view of ["dashboard", "analytics"] as const) {
  test(`${view}: timestamps, filter metadata and chart points do not imply a KPI change`, () => {
    const before = snapshot()
    const after = structuredClone(before)
    after.generated_at = "2026-10-08T09:00:20Z"
    after.date_filter = { mode: "all_time", ref_date: "2026-10-08" }
    after.users.registrations_last_30_days = [{ date: "2026-10-08", count: 1 }]
    after.payments.revenue_last_30_days = [{ date: "2026-10-08", revenue: 300 }]
    assert.equal(getAnalyticsKpiSignature(before, view), getAnalyticsKpiSignature(after, view))
  })

  test(`${view}: rearranging breakdowns leaves the KPI signature unchanged`, () => {
    const before = snapshot()
    const after = structuredClone(before)
    after.subscriptions.by_status.reverse()
    after.content.questions_by_type.reverse()
    assert.equal(getAnalyticsKpiSignature(before, view), getAnalyticsKpiSignature(after, view))
  })

  test(`${view}: new users, revenue and inactive counts are detected`, () => {
    for (const change of [
      (data: DashboardData) => { data.users.total_users++ },
      (data: DashboardData) => { data.payments.total_revenue += 300 },
      (data: DashboardData) => { data.subscriptions.by_status[1].count++ },
      (data: DashboardData) => { data.notifications.unread_count++ },
    ]) {
      const before = snapshot()
      const after = structuredClone(before)
      change(after)
      assert.notEqual(getAnalyticsKpiSignature(before, view), getAnalyticsKpiSignature(after, view))
    }
  })
}

test("analytics: nested video KPI changes are detected", () => {
  const before = snapshot()
  before.videos = {
    total_watch_sessions: 10, completed_sessions: 5, replay_sessions: 2,
    unique_video_starts: 8, users_who_replayed: 2, completion_rate: 0.5,
    replay_rate: 0.2, drop_off_by_checkpoint: [],
  }
  const after = structuredClone(before)
  after.videos!.completed_sessions++
  assert.notEqual(getAnalyticsKpiSignature(before, "analytics"), getAnalyticsKpiSignature(after, "analytics"))
})

test("yearly revenue detects its own change even when the historical page is unchanged", () => {
  const historical = snapshot()
  historical.date_filter = { mode: "year_month", year: 2026, month: 1 }
  historical.payments.total_revenue = 3000
  const historicalAfter = structuredClone(historical)
  const yearlyBefore = snapshot()
  yearlyBefore.date_filter = { mode: "year", year: 2026 }
  const yearlyAfter = structuredClone(yearlyBefore)
  yearlyAfter.payments.total_revenue += 300
  assert.equal(getAnalyticsKpiSignature(historical, "dashboard"), getAnalyticsKpiSignature(historicalAfter, "dashboard"))
  assert.notEqual(getAnalyticsKpiSignature(yearlyBefore, "revenue"), getAnalyticsKpiSignature(yearlyAfter, "revenue"))
})

test("yearly revenue ignores unrelated KPI and timestamp changes", () => {
  const before = snapshot()
  const after = structuredClone(before)
  after.users.total_users++
  after.generated_at = "2026-10-08T09:00:20Z"
  assert.equal(getAnalyticsKpiSignature(before, "revenue"), getAnalyticsKpiSignature(after, "revenue"))
})
