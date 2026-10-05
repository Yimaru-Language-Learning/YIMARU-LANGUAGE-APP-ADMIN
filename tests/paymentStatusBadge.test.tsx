import assert from "node:assert/strict"
import test from "node:test"
import { renderToStaticMarkup } from "react-dom/server"
import {
  PaymentStatusBadge,
  PaymentStatusIcon,
} from "../src/components/payments/PaymentStatusBadge"
import {
  paymentStatusAppearance,
  paymentStatusBadgeVariant,
} from "../src/lib/payments"

test("failed stays red while expired and cancelled become neutral", () => {
  assert.equal(paymentStatusBadgeVariant("FAILED"), "destructive")
  assert.equal(paymentStatusBadgeVariant("EXPIRED"), "secondary")
  assert.equal(paymentStatusBadgeVariant("CANCELLED"), "secondary")
  assert.equal(paymentStatusBadgeVariant("CANCELED"), "secondary")
})

test("expired and cancelled have distinct palettes and icons", () => {
  const expired = paymentStatusAppearance("EXPIRED")
  const cancelled = paymentStatusAppearance("CANCELLED")
  assert.equal(expired.icon, "clock")
  assert.equal(cancelled.icon, "x")
  assert.match(expired.badgeClassName, /bg-slate-100/)
  assert.match(cancelled.badgeClassName, /bg-grayScale-100/)
  assert.notEqual(expired.badgeClassName, cancelled.badgeClassName)
  assert.match(expired.detailIconClassName, /text-slate-700/)
  assert.match(cancelled.detailIconClassName, /text-grayScale-600/)
})

for (const status of ["SUCCESS", "COMPLETED", "PAID"]) {
  test(`${status} remains green`, () => {
    assert.equal(paymentStatusBadgeVariant(status), "success")
  })
}
for (const status of ["PENDING", "PROCESSING"]) {
  test(`${status} remains amber`, () => {
    assert.equal(paymentStatusBadgeVariant(status), "warning")
  })
}

test("handles casing, whitespace, and unknown statuses safely", () => {
  assert.equal(paymentStatusAppearance(" expired ").icon, "clock")
  assert.equal(paymentStatusAppearance("cancelled").icon, "x")
  assert.equal(paymentStatusAppearance("CANCELED").icon, "x")
  assert.equal(paymentStatusBadgeVariant(" failed "), "destructive")
  assert.equal(paymentStatusAppearance("UNKNOWN").variant, "secondary")
  assert.equal(paymentStatusAppearance("UNKNOWN").icon, null)
})

for (const [status, icon, color] of [
  ["EXPIRED", "clock", "bg-slate-100"],
  ["CANCELLED", "x", "bg-grayScale-100"],
] as const) {
  test(`${status} badge renders its label and decorative ${icon} icon`, () => {
    const markup = renderToStaticMarkup(<PaymentStatusBadge status={status} />)
    assert.match(markup, new RegExp(`lucide-${icon}`))
    assert.match(markup, new RegExp(color))
    assert.match(markup, /aria-hidden="true"/)
    assert.match(markup, new RegExp(status))
    assert.doesNotMatch(markup, /bg-destructive/)
    const detailIcon = renderToStaticMarkup(<PaymentStatusIcon status={status} />)
    assert.match(detailIcon, new RegExp(`lucide-${icon}`))
  })
}

test("failed badge keeps its label and red variant", () => {
  const markup = renderToStaticMarkup(<PaymentStatusBadge status="FAILED" />)
  assert.match(markup, /bg-destructive/)
  assert.match(markup, /FAILED/)
  assert.doesNotMatch(markup, /<svg/)
})
