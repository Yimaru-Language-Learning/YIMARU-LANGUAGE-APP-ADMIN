import assert from "node:assert/strict"
import test from "node:test"
import { checkoutRequestStatus } from "../src/lib/checkoutRequests"
import type { CheckoutRequest } from "../src/api/checkout-requests.api"
import { isPathAllowedForTeamRole } from "../src/lib/adminAccess"
import { readFileSync } from "node:fs"

test("history never presents provider acceptance as inbox delivery or payment", () => {
  for (const [metadata, expected] of [
    [{ legacy: true }, "Sent (legacy record)"],
    [{ status: "provider_accepted" }, "Accepted by provider"],
    [{ status: "unconfirmed" }, "Delivery unconfirmed"],
    [{ status: "processing" }, "Processing / outcome unknown"],
    [{}, "Processing / outcome unknown"],
  ] as const) assert.equal(checkoutRequestStatus({ metadata } as CheckoutRequest), expected)
})

test("content managers cannot open checkout history", () => {
  assert.equal(isPathAllowedForTeamRole("/notifications/checkout-requests", "CONTENT_MANAGER"), false)
  assert.equal(isPathAllowedForTeamRole("/notifications/checkout-requests", "ADMIN"), true)
})

test("history fetches are permission-gated and cancel superseded searches", () => {
  const page = readFileSync(new URL("../src/pages/notifications/CheckoutRequestsPage.tsx", import.meta.url), "utf8")
  assert.match(page, /if \(permissionsLoading \|\| !allowed\) return/)
  assert.match(page, /controller\.abort\(\)/)
  assert.match(page, /if \(!current\) return/)
  assert.match(page, /Delivery channel/)
  assert.match(page, /Could not load checkout requests/)
  assert.match(page, /Retry/)
})
