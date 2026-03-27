import http from "./http";
import {
  type UserProfileResponse,
  type GetUsersResponse,
  type UpdateProfileRequest,
  type UserSummaryResponse,
  type GetDeletionRequestsParams,
  type GetDeletionRequestsResponse,
} from "../types/user.types";

export const getUsers = (
  page?: number,
  pageSize?: number,
  role?: string,
  status?: string,
  query?: string,
) =>
  http.get<GetUsersResponse>("/users", {
    params: {
      role,
      status,
      query,
      page,
      page_size: pageSize,
    },
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
