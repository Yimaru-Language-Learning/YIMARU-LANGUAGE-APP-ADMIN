import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS,
  EMPTY_PLATFORM_AUDIENCE_FILTERS,
  countPlatformAudienceActiveFilters,
  platformAudienceFiltersToGetUsersParams,
  toggleAudienceSubscriptionStatus,
} from "../src/lib/platformAudienceFilters"
import { SubscriptionStatusFilter } from "../src/components/notifications/SubscriptionStatusFilter"
import { buildUsersListQuery } from "../src/api/users.api"
import http from "../src/api/http"
import { fetchAllPlatformUsersMatching } from "../src/lib/notificationBulk"

test("offers four separate statuses without the broad Unsubscribed option", () => {
  assert.deepEqual(AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS.map((option) => option.code), [
    "ACTIVE", "PENDING", "EXPIRED", "NEVER_SUBSCRIBED",
  ])
})

test("empty selection means Any status and does not count as an active filter", () => {
  assert.equal(countPlatformAudienceActiveFilters(EMPTY_PLATFORM_AUDIENCE_FILTERS), 0)
  const params = platformAudienceFiltersToGetUsersParams(EMPTY_PLATFORM_AUDIENCE_FILTERS)
  assert.equal(params.subscription_status, undefined)
  assert.equal("subscription_status" in buildUsersListQuery(params), false)
})

test("adding and removing statuses preserves other selections without mutating state", () => {
  const original = ["PENDING"] as const
  const selected = toggleAudienceSubscriptionStatus(original, "EXPIRED")
  assert.deepEqual(selected, ["PENDING", "EXPIRED"])
  assert.deepEqual(original, ["PENDING"])
  assert.deepEqual(toggleAudienceSubscriptionStatus(selected, "PENDING"), ["EXPIRED"])
  assert.deepEqual(toggleAudienceSubscriptionStatus(["EXPIRED"], "EXPIRED"), [])
})

for (const { code } of AUDIENCE_SUBSCRIPTION_STATUS_OPTIONS) {
  test(`serializes the individual ${code} selection`, () => {
    const params = platformAudienceFiltersToGetUsersParams({
      ...EMPTY_PLATFORM_AUDIENCE_FILTERS, subscriptionStatuses: [code],
    })
    assert.equal(buildUsersListQuery(params).subscription_status, code)
  })
}

test("multiple statuses are sent together and count as one active filter", () => {
  const filters = {
    ...EMPTY_PLATFORM_AUDIENCE_FILTERS,
    subscriptionStatuses: toggleAudienceSubscriptionStatus(["PENDING"], "EXPIRED"),
    country: "Ethiopia",
    hasEverPaid: "false",
  }
  assert.equal(countPlatformAudienceActiveFilters(filters), 3)
  const query = buildUsersListQuery(platformAudienceFiltersToGetUsersParams(filters))
  assert.equal(query.subscription_status, "PENDING,EXPIRED")
  assert.equal(query.country, "Ethiopia")
  assert.equal(query.has_ever_paid, false)
})

test("trigger shows selected labels, explanatory text, and a non-submit button", () => {
  const html = renderToStaticMarkup(
    <SubscriptionStatusFilter selected={["EXPIRED", "PENDING"]} onChange={() => {}} />,
  )
  assert.match(html, /Pending, Expired/)
  assert.match(html, /Matches any selected status/)
  assert.match(html, /type="button"/)
  assert.doesNotMatch(html, /Unsubscribed/)
})

test("cleared selection renders Any status", () => {
  const html = renderToStaticMarkup(<SubscriptionStatusFilter selected={[]} onChange={() => {}} />)
  assert.match(html, /Any status/)
})

test("every recipient page uses the same multi-status filter (mock HTTP only)", async () => {
  const originalAdapter = http.defaults.adapter
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null },
  })
  const queries: Record<string, unknown>[] = []
  http.defaults.adapter = async (config) => {
    assert.equal(config.url, "/users")
    const params = config.params as Record<string, number | string>
    queries.push({ ...params })
    const page = Number(params.page)
    const users = Array.from({ length: page === 3 ? 1 : 50 }, (_, i) => ({
      id: (page - 1) * 50 + i + 1,
    }))
    return {
      config, status: 200, statusText: "OK", headers: {},
      data: { data: { users, total: 101 } },
    }
  }
  try {
    const users = await fetchAllPlatformUsersMatching({
      ...EMPTY_PLATFORM_AUDIENCE_FILTERS,
      subscriptionStatuses: ["PENDING", "EXPIRED", "NEVER_SUBSCRIBED"],
    })
    assert.equal(users.length, 101)
    assert.equal(new Set(users.map((user) => user.id)).size, 101)
    assert.deepEqual(queries.map((query) => query.page).sort(), [1, 2, 3])
    for (const query of queries) {
      assert.equal(query.subscription_status, "PENDING,EXPIRED,NEVER_SUBSCRIBED")
    }
  } finally {
    http.defaults.adapter = originalAdapter
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})
