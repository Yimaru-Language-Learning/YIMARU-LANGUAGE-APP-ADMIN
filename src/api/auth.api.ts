import http from "./http";
import type { LoginRequest, LoginResponse, LoginResponseData } from "../types/auth.types";

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  role: string;
  user_id: number;
}

export const login = async (payload: LoginRequest): Promise<LoginResult> => {
  const res = await http.post<LoginResponse>("/auth/customer-login", payload);

  const data: LoginResponseData = res.data.data;

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    role: data.role,
    user_id: data.user_id,
  };
};
