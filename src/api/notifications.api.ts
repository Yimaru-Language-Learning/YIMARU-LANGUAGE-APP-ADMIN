import http from "./http";
import type { GetNotificationsResponse, UnreadCountResponse } from "../types/notification.types";

export const getNotifications = (limit = 10, offset = 0) =>
  http.get<GetNotificationsResponse>("/notifications", {
    params: { limit, offset },
  });

export const getUnreadCount = () =>
  http.get<UnreadCountResponse>("/notifications/unread");

export const markAsRead = (id: string) =>
  http.patch(`/notifications/${id}/read`);

export const markAsUnread = (id: string) =>
  http.patch(`/notifications/${id}/unread`);

export const markAllRead = () =>
  http.post("/notifications/mark-all-read");

export const markAllUnread = () =>
  http.post("/notifications/mark-all-unread");
