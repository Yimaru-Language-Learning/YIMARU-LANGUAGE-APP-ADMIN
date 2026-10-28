import assert from "node:assert/strict"
import test from "node:test"
import { activityAppLabel, activityRequestId } from "../src/lib/activityAppMetadata"

test("formats Android and iOS releases without inferring an outdated version", () => {
  assert.equal(activityAppLabel({ app_platform: "android", app_version: "1.5.2", app_build: "83" }), "Android · 1.5.2 (83)")
  assert.equal(activityAppLabel({ app_platform: "ios", app_version: "1.5.2", app_build: "83" }), "iOS · 1.5.2 (83)")
  assert.equal(activityAppLabel({}), "Version unavailable")
  assert.equal(activityAppLabel({ app_platform: "ios" }), "iOS · Version unavailable")
})

test("partial or invalid legacy metadata renders safely", () => {
  assert.equal(activityAppLabel({ app_version: "1.5.2" }), "1.5.2")
  assert.equal(activityAppLabel({ app_build: "83" }), "Version unavailable (build 83)")
  assert.equal(activityAppLabel({ app_platform: "other", app_version: {}, app_build: 83 }), "Version unavailable")
  assert.equal(activityAppLabel({ app_version: "<script>", app_build: "x".repeat(65) }), "Version unavailable")
})

test("request correlation is optional and does not coerce arbitrary JSON", () => {
  const id = "2eaa0430-6a57-41c6-98b4-7d306fb9dc66"
  assert.equal(activityRequestId({ request_id: id }), id)
  assert.equal(activityRequestId({}), null)
  assert.equal(activityRequestId({ request_id: {} }), null)
  assert.equal(activityRequestId({ request_id: "bad\nvalue" }), null)
})
