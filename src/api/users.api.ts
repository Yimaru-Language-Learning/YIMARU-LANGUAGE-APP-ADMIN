import http from "./http";
import { type UserProfileResponse, type GetUsersResponse } from "../types/user.types";

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
