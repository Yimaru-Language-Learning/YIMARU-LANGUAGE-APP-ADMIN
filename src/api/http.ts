import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Do not force a Content-Type globally.
  // Axios will set the correct header based on the request body (JSON vs multipart FormData).
  headers: {},
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];
const TOKEN_REFRESH_BUFFER_SECONDS = 120;

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

const clearAuthAndRedirect = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("member_id");
  localStorage.removeItem("role");
  window.location.href = "/login";
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
    url.includes("/team/refresh")
  );
};

const refreshAccessToken = async (): Promise<string> => {
  const refreshToken = localStorage.getItem("refresh_token");

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/team/refresh`,
    {
      refresh_token: refreshToken,
    }
  );

  const newAccessToken = response.data?.data?.access_token;
  const newRefreshToken = response.data?.data?.refresh_token;

  if (newAccessToken) {
    localStorage.setItem("access_token", newAccessToken);
  }
  if (newRefreshToken) {
    localStorage.setItem("refresh_token", newRefreshToken);
  }

  return newAccessToken;
};

const getValidAccessToken = async (forceRefresh = false): Promise<string> => {
  const currentToken = localStorage.getItem("access_token");
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
    processQueue(null, newToken);
    return newToken;
  } catch (refreshError) {
    processQueue(refreshError as Error, null);
    clearAuthAndRedirect();
    throw refreshError;
  } finally {
    isRefreshing = false;
  }
};

// Attach access token to every request
http.interceptors.request.use(async (config) => {
  if (isAuthEndpointRequest(config.url)) {
    return config;
  }

  let token = localStorage.getItem("access_token");
  if (token && isAccessTokenExpiringSoon(token)) {
    token = await getValidAccessToken();
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally with token refresh
http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpointRequest(originalRequest.url)
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

    // Backend is down (network error, timeout, connection refused)
    if (!error.response) {
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default http;
