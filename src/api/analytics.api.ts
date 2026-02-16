import http from "./http";
import type { DashboardResponse } from "../types/analytics.types";

export const getDashboard = () =>
  http.get<DashboardResponse>("/analytics/dashboard");
