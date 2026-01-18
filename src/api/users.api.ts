import http from "./http";
import { type UserProfileResponse, type GetUsersResponse } from "../types/user.types";

export const getUsers = (page?: number, pageSize?: number) =>
  http.get<GetUsersResponse>("/users", {
    params: {
      page,
      page_size: pageSize,
    },
  });

export const getUserById = (id: number) =>
  http.get<UserProfileResponse>(`/user/single/${id}`);
