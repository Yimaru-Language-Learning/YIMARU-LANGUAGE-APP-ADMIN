import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from "axios";

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: Error) => void;
}> = [];

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

const refreshAccessToken = async (): Promise<string> => {
  const accessToken = localStorage.getItem("access_token");
  const refreshToken = localStorage.getItem("refresh_token");
  const role = localStorage.getItem("role");
  const memberId = localStorage.getItem("member_id");

  if (!refreshToken || !memberId) {
    throw new Error("No refresh token available");
  }

  const response = await axios.post(
    `${import.meta.env.VITE_API_BASE_URL}/auth/refresh`,
    {
      access_token: accessToken,
      refresh_token: refreshToken,
      role: role || "admin",
      member_id: Number(memberId),
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

// Attach access token to every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
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

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return http(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return http(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default http;
