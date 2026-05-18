import http from "./http";
import type { DashboardData, DashboardFilters, DashboardResponse } from "../types/analytics.types";

function buildDashboardQueryParams(filters?: DashboardFilters): Record<string, string | number> {
  if (!filters || filters.mode === "all_time") {
    return {};
  }

  if (filters.mode === "year" && filters.year != null) {
    return { year: filters.year };
  }

  if (filters.mode === "year_month" && filters.year != null && filters.month != null) {
    return { year: filters.year, month: filters.month };
  }

  if (filters.mode === "custom" && filters.from && filters.to) {
    return { from: filters.from, to: filters.to };
  }

  return {};
}

function unwrapDashboardResponse(body: DashboardResponse | DashboardData): DashboardData {
  if (body && typeof body === "object" && "data" in body && body.data) {
    return body.data;
  }
  return body as DashboardData;
}

export const getDashboard = (filters?: DashboardFilters) =>
  http
    .get<DashboardResponse | DashboardData>("/analytics/dashboard", {
      params: buildDashboardQueryParams(filters),
    })
    .then((res) => ({
      ...res,
      data: unwrapDashboardResponse(res.data),
    }));
