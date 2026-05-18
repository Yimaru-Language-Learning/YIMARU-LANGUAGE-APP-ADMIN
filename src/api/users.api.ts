import http from "./http";
import {
  type UserProfileResponse,
  type GetUsersResponse,
  type UpdateProfileRequest,
  type UserSummaryResponse,
  type GetDeletionRequestsParams,
  type GetDeletionRequestsResponse,
  type UserRecentActivityResponse,
} from "../types/user.types";

/** Query params for GET /users (RFC3339 for created_*; subscription_status: ACTIVE | PENDING | Unsubscribed). */
export interface GetUsersParams {
  page?: number
  page_size?: number
  role?: string
  status?: string
  query?: string
  created_before?: string
  created_after?: string
  country?: string
  region?: string
  subscription_status?: string
}

function buildGetUsersQuery(params: GetUsersParams): Record<string, string | number> {
  const q: Record<string, string | number> = {}
  const addString = (key: string, value: string | undefined) => {
    const v = value?.trim()
    if (!v) return
    q[key] = v
  }
  if (params.page !== undefined) q.page = params.page
  if (params.page_size !== undefined) q.page_size = params.page_size
  addString("role", params.role)
  addString("status", params.status)
  addString("query", params.query)
  addString("created_before", params.created_before)
  addString("created_after", params.created_after)
  addString("country", params.country)
  addString("region", params.region)
  addString("subscription_status", params.subscription_status)
  return q
}

export const getUsers = (params: GetUsersParams = {}) =>
  http.get<GetUsersResponse>("/users", {
    params: buildGetUsersQuery(params),
  });

export type UserStatus = "ACTIVE" | "DEACTIVATED" | "SUSPENDED" | "PENDING";

export interface UpdateUserStatusRequest {
  user_id: number;
  status: UserStatus;
}

export const updateUserStatus = (payload: UpdateUserStatusRequest) =>
  http.patch("/user/status", payload);

export const getUserById = (id: number) =>
  http.get<UserProfileResponse>(`/user/single/${id}`);

export const getUserRecentActivity = (userId: number) =>
  http.get<UserRecentActivityResponse>(`/admin/users/${userId}/recent-activity`);

export const getMyProfile = () =>
  http.get<UserProfileResponse>("/team/me");

// Best-guess API for creating a new user (admin-side).
// Adjust payload shape or endpoint if backend differs.
export interface CreateUserRequest {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  role: string;
  notes?: string;
}

export const createUser = (payload: CreateUserRequest) =>
  http.post("/users", payload);

export const updateProfile = (data: UpdateProfileRequest) =>
  http.put<UserProfileResponse>("/user", data);

export const getUserSummary = () =>
  http.get<UserSummaryResponse>("/users/summary");

export const getDeletionRequests = (params: GetDeletionRequestsParams) =>
  http.get<GetDeletionRequestsResponse>("/admin/users/deletion-requests", { params });

export const updateUserProfilePicture = (id: number, profilePictureUrl: string) =>
  http.post(`/user/${id}/profile-picture`, {
    profile_picture_url: profilePictureUrl,
  });
