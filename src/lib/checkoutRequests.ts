import type { CheckoutRequest } from "../api/checkout-requests.api"

export function checkoutRequestStatus(request: CheckoutRequest): string {
  if (request.metadata.legacy) return "Sent (legacy record)"
  if (request.metadata.status === "provider_accepted") return "Accepted by provider"
  if (request.metadata.status === "unconfirmed") return "Delivery unconfirmed"
  return "Processing / outcome unknown"
}
