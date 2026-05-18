import http from "./http"
import type { SubscriptionPlansListResponse, SubscriptionPlan } from "../types/subscription.types"

export const getSubscriptionPlans = () =>
  http.get<SubscriptionPlansListResponse>("/subscription-plans").then((res) => ({
    ...res,
    data: {
      ...res.data,
      data: Array.isArray(res.data?.data) ? res.data.data : ([] as SubscriptionPlan[]),
    },
  }))
