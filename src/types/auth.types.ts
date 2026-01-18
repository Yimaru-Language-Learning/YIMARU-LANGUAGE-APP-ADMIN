export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponseData {
  access_token: string;
  refresh_token: string;
  role: string;
  user_id: number;
}

export interface LoginResponse {
  message: string;
  data: LoginResponseData;
  success: boolean;
  status_code: number;
  metadata: any | null;
}

