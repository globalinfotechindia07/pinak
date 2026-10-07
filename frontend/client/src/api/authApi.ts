import apiClient from "./client";
import {
  AuthResponse,
  LoginRequest,
  OtpRequest,
  VerifyOtpRequest,
  UserDTO,
} from "../types/api/auth.dto";
import { ApiResponse } from "../types/api/common";
import { tokenManager } from "./tokenManager";
import { fetchCsrfToken } from "./csrf";
import { getDeviceInfo } from "./fingerprint";
import { authChannel } from "./authChannel";

export const authApi = {
  /**
   * Initializes or refreshes CSRF token from the server.
   */
  getCsrfToken: async (): Promise<string | null> => {
    return fetchCsrfToken();
  },

  /**
   * Authenticates user with identifier (email/phone) and password.
   * On Web: Refresh token is securely stored in HttpOnly cookie by Spring Boot;
   * Access token is saved directly to in-memory TokenManager.
   */
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const rawId = (payload.identifier || payload.email || "").trim();
    const { deviceId, deviceName } = getDeviceInfo();

    const requestBody = {
      identifier: rawId,
      email: rawId,
      phone: rawId,
      mobile: rawId,
      password: payload.password,
      deviceId: payload.deviceId || deviceId,
      deviceName: payload.deviceName || deviceName,
    };

    // Make sure CSRF token is initialized prior to login
    await fetchCsrfToken().catch(() => {});

    const res = await apiClient.post<any>("/auth/login", requestBody);
    const resData = res.data?.data || res.data;

    const accessToken = resData?.accessToken || resData?.tokens?.accessToken || "";
    const refreshToken = resData?.refreshToken || resData?.tokens?.refreshToken || "";

    if (accessToken) {
      tokenManager.setAccessToken(accessToken, () => {
        authApi.refresh().catch((err) => console.warn("[ProactiveRefresh] Error:", err));
      });
    }

    const user: UserDTO = resData?.user || {
      id: "user-1",
      email: rawId,
      role: payload.role || "MERCHANT",
      status: "ACTIVE",
    };

    // Broadcast login to sync across open browser tabs
    authChannel.broadcast({ type: "AUTH_LOGIN", email: user.email, role: user.role });

    return {
      accessToken,
      refreshToken,
      tokenType: resData?.tokenType || "Bearer",
      expiresIn: resData?.expiresIn || 86400,
      user,
      tokens: {
        accessToken,
        refreshToken,
        tokenType: resData?.tokenType || "Bearer",
        expiresIn: resData?.expiresIn || 86400,
      },
    };
  },

  /**
   * Rotates refresh token via HttpOnly cookie and retrieves a new in-memory access token.
   */
  refresh: async (): Promise<string | null> => {
    try {
      const res = await apiClient.post<any>("/auth/refresh", {});
      const resData = res.data?.data || res.data;
      const newAccessToken = resData?.accessToken || resData?.tokens?.accessToken;

      if (newAccessToken) {
        tokenManager.setAccessToken(newAccessToken, () => {
          authApi.refresh().catch(() => {});
        });
        return newAccessToken;
      }
      return null;
    } catch (err) {
      tokenManager.clearAccessToken();
      throw err;
    }
  },

  /**
   * Enterprise Silent Session Bootstrapper:
   * Restores user session from HttpOnly cookie on page load / hard reload (F5)
   * without requiring user to log in again.
   */
  bootstrapSession: async (): Promise<UserDTO | null> => {
    try {
      // 1. Ensure CSRF cookie is fresh
      await fetchCsrfToken().catch(() => {});

      // 2. Attempt silent token refresh via HttpOnly cookie
      const token = await authApi.refresh();
      if (!token) return null;

      // 3. Fetch authenticated profile
      const user = await authApi.getMe();
      return user;
    } catch {
      // No active session cookie or expired — clean state
      tokenManager.clearAccessToken();
      return null;
    }
  },

  /**
   * Request 6-digit OTP for phone number.
   */
  requestOtp: async (payload: OtpRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>("/auth/otp/request", payload);
    return res.data?.data || { message: "OTP sent" };
  },

  /**
   * Verify OTP and complete authentication.
   */
  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<any>("/auth/otp/verify", payload);
    const resData = res.data?.data || res.data;
    const accessToken = resData?.accessToken || resData?.tokens?.accessToken || "";
    const refreshToken = resData?.refreshToken || resData?.tokens?.refreshToken || "";

    if (accessToken) {
      tokenManager.setAccessToken(accessToken, () => {
        authApi.refresh().catch(() => {});
      });
    }

    const user = resData?.user || {
      id: "user-1",
      email: payload.phone,
      role: "MERCHANT",
      status: "ACTIVE",
    };

    authChannel.broadcast({ type: "AUTH_LOGIN", email: user.email, role: user.role });

    return {
      accessToken,
      refreshToken,
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  },

  /**
   * Get Current Authenticated User & Roles from backend /auth/me.
   */
  getMe: async (): Promise<UserDTO> => {
    const res = await apiClient.get<ApiResponse<UserDTO>>("/auth/me");
    return res.data?.data || (res.data as unknown as UserDTO);
  },

  /**
   * Revoke session on backend, clear HttpOnly cookie, and wipe in-memory token.
   */
  logout: async (sessionId?: string): Promise<void> => {
    try {
      await apiClient.post("/auth/logout", { sessionId });
    } catch (err) {
      console.warn("[AuthApi] Logout request warning:", err);
    } finally {
      tokenManager.clearAccessToken();
      authChannel.broadcast({ type: "AUTH_LOGOUT" });
    }
  },
};

export default authApi;
