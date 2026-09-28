import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

// Storage keys
export const ACCESS_TOKEN_KEY = "pinak_access_token";
export const REFRESH_TOKEN_KEY = "pinak_refresh_token";
export const USER_INFO_KEY = "pinak_user_info";

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearStoredTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_INFO_KEY);
}

// Concurrency mutex state for silent token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function setupInterceptors(axiosInstance: AxiosInstance): void {
  // Request Interceptor: Inject Bearer Token
  axiosInstance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = getStoredAccessToken();
      if (token && !config.headers.Authorization) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response Interceptor: 401 Auto-Refresh Mutex
  axiosInstance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Avoid infinite loop if refresh endpoint itself failed with 401
      if (
        error.response?.status === 401 &&
        originalRequest &&
        !originalRequest._retry &&
        !originalRequest.url?.includes("/auth/token/refresh") &&
        !originalRequest.url?.includes("/auth/login")
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                originalRequest.headers.Authorization = `Bearer ${token}`;
              }
              return axiosInstance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = getStoredRefreshToken();
        if (!refreshToken) {
          clearStoredTokens();
          isRefreshing = false;
          // Optionally notify or redirect
          return Promise.reject(error);
        }

        try {
          const baseURL = axiosInstance.defaults.baseURL || "";
          const response = await axios.post(`${baseURL}/auth/token/refresh`, {
            refreshToken,
          });

          const newAccessToken =
            response.data?.data?.tokens?.accessToken || response.data?.accessToken;
          const newRefreshToken =
            response.data?.data?.tokens?.refreshToken || response.data?.refreshToken;

          if (newAccessToken) {
            setStoredTokens(newAccessToken, newRefreshToken);
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
            }
            processQueue(null, newAccessToken);
            return axiosInstance(originalRequest);
          } else {
            throw new Error("No access token in refresh response");
          }
        } catch (refreshError) {
          processQueue(refreshError as AxiosError, null);
          clearStoredTokens();
          window.dispatchEvent(new Event("pinak:unauthorized"));
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}
