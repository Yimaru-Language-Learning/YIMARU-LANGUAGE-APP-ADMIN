import assert from "node:assert/strict"
import test from "node:test"
import { getAnalyticsPollDelay } from "../src/lib/analyticsPolling"

test("successful request time is subtracted from the 20-second interval", () => {
  assert.equal(getAnalyticsPollDelay(100_000, 102_000, 0), 18_000)
  assert.equal(getAnalyticsPollDelay(100_000, 119_999, 0), 1)
  assert.equal(getAnalyticsPollDelay(100_000, 100_000, 0), 20_000)
})

test("slow requests skip missed slots without an immediate catch-up burst", () => {
  assert.equal(getAnalyticsPollDelay(100_000, 125_000, 0), 15_000)
  assert.equal(getAnalyticsPollDelay(100_000, 140_000, 0), 20_000)
})

test("failure retries back off from completion and cap at two minutes", () => {
  assert.equal(getAnalyticsPollDelay(100_000, 125_000, 1), 40_000)
  assert.equal(getAnalyticsPollDelay(100_000, 125_000, 2), 80_000)
  assert.equal(getAnalyticsPollDelay(100_000, 125_000, 3), 120_000)
  assert.equal(getAnalyticsPollDelay(100_000, 125_000, 10), 120_000)
  assert.equal(getAnalyticsPollDelay(100_000, 102_000, 0), 18_000)
})
