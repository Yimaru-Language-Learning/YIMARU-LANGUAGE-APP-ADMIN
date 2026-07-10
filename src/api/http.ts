import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { toast } from "sonner";
import { teamRefresh } from "./teamRefresh.api";
import { TeamAuthError } from "../types/auth.types";
import {
  clearTeamSession,
  getAccessToken,
  getRefreshToken,
  saveTeamSession,
} from "../lib/teamAuthStorage";
import { markApiErrorNotified, readApiResponseMessage } from "../lib/apiErrors";

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {},
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];
const TOKEN_REFRESH_BUFFER_SECONDS = 60;

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else if (token) {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthAndRedirect = (reason?: "inactive") => {
  clearTeamSession();
  const suffix = reason === "inactive" ? "?account_inactive=1" : "";
  window.location.href = `/login${suffix}`;
};

const decodeJwtPayload = (token: string): Record<string, unknown> | null => {
  try {
    const payloadPart = token.split(".")[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
};

const isAccessTokenExpiringSoon = (token: string) => {
  const payload = decodeJwtPayload(token);
  const exp = Number(payload?.exp);
  if (!Number.isFinite(exp)) return true;
  const nowSeconds = Math.floor(Date.now() / 1000);
  return exp - nowSeconds <= TOKEN_REFRESH_BUFFER_SECONDS;
};

const isAuthEndpointRequest = (url?: string) => {
  if (!url) return false;
  return (
    url.includes("/team/login") ||
    url.includes("/team/google-login") ||
    url.includes("/team/refresh") ||
    url.includes("/team/invitations/verify") ||
    url.includes("/team/invitations/accept") ||
    url.includes("/team/sendResetCode") ||
    url.includes("/team/resetPassword")
  );
};

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

const safeOrigin = (url?: string): string | null => {
  if (!url) return null;
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
};

const API_BASE_ORIGIN = safeOrigin(import.meta.env.VITE_API_BASE_URL);

const shouldAttachApiAuth = (url?: string): boolean => {
  if (!url) return true;
  if (!ABSOLUTE_URL_REGEX.test(url)) return true;
  const requestOrigin = safeOrigin(url);
  if (!requestOrigin || !API_BASE_ORIGIN) return false;
  return requestOrigin === API_BASE_ORIGIN;
};

function isRefreshableAccessTokenError(error: AxiosError): boolean {
  if (error.response?.status !== 401) return false;
  const message = readApiResponseMessage(error.response.data).toLowerCase();
  return (
    message.includes("access token expired") ||
    message.includes("invalid access token")
  );
}

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const session = await teamRefresh(refreshToken);
  saveTeamSession(session);
  return session.access_token;
};

const getValidAccessToken = async (forceRefresh = false): Promise<string> => {
  const currentToken = getAccessToken();
  if (!forceRefresh && currentToken && !isAccessTokenExpiringSoon(currentToken)) {
    return currentToken;
  }

  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;
  try {
    const newToken = await refreshAccessToken();
    if (!newToken) {
      throw new Error("Refresh response did not include an access token");
    }
    processQueue(null, newToken);
    return newToken;
  } catch (refreshError) {
    processQueue(refreshError as Error, null);
    const status =
      refreshError instanceof TeamAuthError
        ? refreshError.status
        : axios.isAxiosError(refreshError)
          ? refreshError.response?.status
          : undefined;
    if (status === 403) {
      clearAuthAndRedirect("inactive");
    } else {
      clearAuthAndRedirect();
    }
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

http.interceptors.request.use(async (config) => {
  if (!shouldAttachApiAuth(config.url)) {
    return config;
  }

  if (isAuthEndpointRequest(config.url)) {
    return config;
  }

  let token = getAccessToken();
  if (token && isAccessTokenExpiringSoon(token)) {
    token = await getValidAccessToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      shouldAttachApiAuth(originalRequest.url) &&
      !isAuthEndpointRequest(originalRequest.url) &&
      isRefreshableAccessTokenError(error)
    ) {
      originalRequest._retry = true;

      try {
        const newToken = await getValidAccessToken(true);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    const skipErrorToast =
      originalRequest.skipErrorToast || isAuthEndpointRequest(originalRequest.url);
    if (!skipErrorToast && error.response) {
      const message = readApiResponseMessage(error.response.data);
      if (message) {
        toast.error(message);
        markApiErrorNotified(error);
      }
    }

    return Promise.reject(error);
  },
);

export default http;
