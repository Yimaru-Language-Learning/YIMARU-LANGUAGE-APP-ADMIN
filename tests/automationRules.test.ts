import assert from "node:assert/strict"
import test from "node:test"
import { AxiosError } from "axios"
import { validateAutomationConfig } from "../src/lib/automationRules"
import type { AutomationConfig } from "../src/types/automation.types"
import { getAutomations, saveAutomations } from "../src/api/automations.api"
import { getScheduledNotifications } from "../src/api/notifications.api"
import http from "../src/api/http"

function configuration(): AutomationConfig {
  return { version: 3, rules: ["payment_recovery", "inactivity"].map((kind, index) => ({ kind: kind as "payment_recovery" | "inactivity", enabled: false, channels: ["push"], enabled_at: "", epoch: "", created_by: 0, steps: (index ? [4320, 10080, 20160] : [20, 4320, 10080]).map((delay_minutes) => ({ delay_minutes, title: "Reminder", message: "Safe message" })) })) }
}
test("approved timelines and push-only defaults validate", () => assert.equal(validateAutomationConfig(configuration()), null))
for (const [name, change] of Object.entries({
  "duplicate kind": (c: AutomationConfig) => c.rules[1].kind = c.rules[0].kind,
  "empty channel": (c: AutomationConfig) => c.rules[0].channels = [],
  "duplicate channel": (c: AutomationConfig) => c.rules[0].channels = ["push", "push"],
  "invalid delay": (c: AutomationConfig) => c.rules[0].steps[1].delay_minutes = 1,
  "overflow": (c: AutomationConfig) => c.rules[0].steps[2].delay_minutes = 999999,
  "missing title": (c: AutomationConfig) => c.rules[0].steps[0].title = " ",
  "long unicode message": (c: AutomationConfig) => c.rules[0].steps[0].message = "ሀ".repeat(501),
})) test(`rejects ${name}`, () => { const config = configuration(); change(config); assert.ok(validateAutomationConfig(config)) })

test("settings use the guarded API; scheduled parsing preserves labels, not private delivery metadata", async () => {
  const previousAdapter = http.defaults.adapter
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } })
  const config = configuration()
  http.defaults.adapter = async (request) => {
    if (request.url === "/admin/notification-automations") {
      if (request.method === "put") assert.deepEqual(JSON.parse(request.data), config)
      return { config: request, status: 200, statusText: "OK", headers: {}, data: { data: config } }
    }
    assert.equal(request.url, "/notifications/scheduled")
    return { config: request, status: 200, statusText: "OK", headers: {}, data: { data: { scheduled_notifications: [{ id: 1, channel: "push", status: "pending", target_raw: { automation: { kind: "payment_recovery", step: 1, due_at: "tomorrow", email: "private", accepted: ["private token hash"] } } }] } } }
  }
  try {
    assert.deepEqual(await getAutomations(), config)
    assert.deepEqual(await saveAutomations(config), config)
    const response = await getScheduledNotifications()
    assert.deepEqual(response.data.scheduled_notifications[0].target_raw?.automation, { kind: "payment_recovery", step: 1, due_at: "tomorrow", reason: undefined })
  } finally {
    http.defaults.adapter = previousAdapter
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})

test("conflicting saves propagate without advancing the version or mutating edits", async () => {
  const previousAdapter = http.defaults.adapter
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage")
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: { getItem: () => null } })
  const config = configuration()
  const snapshot = structuredClone(config)
  http.defaults.adapter = async (request) => {
    assert.equal(request.url, "/admin/notification-automations")
    assert.deepEqual(JSON.parse(request.data), snapshot)
    throw new AxiosError("Reload before saving", "ERR_BAD_REQUEST", request, undefined, { config: request, status: 409, statusText: "Conflict", headers: {}, data: { message: "Reload before saving" } })
  }
  try {
    await assert.rejects(saveAutomations(config), (error: unknown) => error instanceof AxiosError && error.response?.status === 409)
    assert.deepEqual(config, snapshot)
  } finally {
    http.defaults.adapter = previousAdapter
    if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor)
    else Reflect.deleteProperty(globalThis, "localStorage")
  }
})
