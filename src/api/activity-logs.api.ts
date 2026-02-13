import http from "./http";
import type {
  GetActivityLogsResponse,
  GetActivityLogResponse,
  ActivityLogFilters,
} from "../types/activity-log.types";

export const getActivityLogs = (filters?: ActivityLogFilters) =>
  http.get<GetActivityLogsResponse>("/activity-logs", {
    params: filters,
  });

export const getActivityLogById = (id: number) =>
  http.get<GetActivityLogResponse>(`/activity-logs/${id}`);
