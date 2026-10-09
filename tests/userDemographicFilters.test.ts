import assert from "node:assert/strict"
import test from "node:test"
import { buildUsersListQuery, getUsers } from "../src/api/users.api"
import http from "../src/api/http"
import { usersExportQuery } from "../src/lib/csvExportFilters"
import { PROFILE_FILTER_AGE_GROUPS } from "../src/lib/userProfileFieldDisplay"

test("age filter uses the existing profile age groups", () => {
  assert.deepEqual(PROFILE_FILTER_AGE_GROUPS.map(({ code }) => code), [
    "UNDER_13", "13_17", "18_24", "25_34", "35_44", "45_54", "55_PLUS",
  ])
  for (const { code } of PROFILE_FILTER_AGE_GROUPS) {
    assert.equal(buildUsersListQuery({ age_group: code }).age_group, code)
  }
})

test("demographic filters are trimmed and shared with CSV export", () => {
  const params = { age_group: " 18_24 ", gender: " female ", country: "Ethiopia", subscription_status: "ACTIVE" }
  assert.deepEqual(buildUsersListQuery(params), {
    age_group: "18_24", gender: "female", country: "Ethiopia", subscription_status: "ACTIVE",
  })
  assert.deepEqual(usersExportQuery(params), buildUsersListQuery(params))
})

test("All age groups / All genders do not restrict the list or export", () => {
  for (const params of [{}, { age_group: "", gender: "" }, { age_group: " \t ", gender: " \t " }]) {
    assert.deepEqual(buildUsersListQuery(params), {})
    assert.deepEqual(usersExportQuery(params), {})
  }
})

test("user list HTTP requests include age and gender alongside pagination", async () => {
  const originalAdapter = http.defaults.adapter
  const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: { getItem: () => null },
  })
  http.defaults.adapter = async (config) => {
    assert.equal(config.url, "/users")
    assert.deepEqual(config.params, { page: 2, page_size: 10, age_group: "25_34", gender: "male" })
    return { config, status: 200, statusText: "OK", headers: {}, data: { data: { users: [], total: 0 } } }
  }
  try {
    await getUsers({ page: 2, page_size: 10, age_group: "25_34", gender: "male" })
  } finally {
    http.defaults.adapter = originalAdapter
    if (storageDescriptor) Object.defineProperty(globalThis, "localStorage", storageDescriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})
