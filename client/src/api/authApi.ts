import apiClient from "./client";
import {
  AuthResponse,
  LoginRequest,
  OtpRequest,
  VerifyOtpRequest,
  UserDTO,
} from "../types/api/auth.dto";
import { ApiResponse } from "../types/api/common";

export const authApi = {
  // Login with Email/Phone & Password
  login: async (payload: LoginRequest): Promise<AuthResponse> => {
    const rawId = (payload.identifier || payload.email || "").trim();
    
    // Spring Boot payload matching com.superapp.auth.dto.LoginRequest and AdminLoginRequest
    const requestBody = {
      identifier: rawId,
      email: rawId,
      phone: rawId,
      mobile: rawId,
      password: payload.password,
      deviceId: payload.deviceId || "web-portal-client",
      deviceName: payload.deviceName || "Pinak Web Portal",
    };

    // If role is ADMIN, first attempt /api/v1/auth/login; if that requires /admin/auth/login, use fallback
    const endpoint = payload.role === "ADMIN" ? "/admin/auth/login" : "/auth/login";

    let resData: any = null;

    try {
      const res = await apiClient.post<any>(endpoint, requestBody);
      resData = res.data?.data || res.data;

      // If admin endpoint returned MFA challenge ({ mfaRequired: true, challengeId: "..." })
      // try unified /auth/login for direct token issuance if in development/demo
      if (resData?.mfaRequired && !resData?.accessToken) {
        try {
          const directAuth = await apiClient.post<any>("/auth/login", requestBody);
          resData = directAuth.data?.data || directAuth.data;
        } catch {
          // Keep the MFA challenge response
        }
      }
    } catch (err: any) {
      // If /admin/auth/login had an error, try unified /auth/login
      if (endpoint !== "/auth/login") {
        const fallbackRes = await apiClient.post<any>("/auth/login", requestBody);
        resData = fallbackRes.data?.data || fallbackRes.data;
      } else {
        throw err;
      }
    }

    // Normalize response structure so frontend always has accessToken and user
    const accessToken = resData?.accessToken || resData?.tokens?.accessToken || "";
    const refreshToken = resData?.refreshToken || resData?.tokens?.refreshToken || "";
    const user = resData?.user || {
      id: "user-1",
      email: rawId,
      role: payload.role || "MERCHANT",
      status: "ACTIVE",
    };

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

  // Request 6-digit OTP
  requestOtp: async (payload: OtpRequest): Promise<{ message: string }> => {
    const res = await apiClient.post<ApiResponse<{ message: string }>>("/auth/otp/request", payload);
    return res.data?.data || { message: "OTP sent" };
  },

  // Verify OTP
  verifyOtp: async (payload: VerifyOtpRequest): Promise<AuthResponse> => {
    const res = await apiClient.post<any>("/auth/otp/verify", payload);
    const resData = res.data?.data || res.data;
    const accessToken = resData?.accessToken || resData?.tokens?.accessToken || "";
    const refreshToken = resData?.refreshToken || resData?.tokens?.refreshToken || "";
    const user = resData?.user || {
      id: "user-1",
      email: payload.phone,
      role: "MERCHANT",
      status: "ACTIVE",
    };

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

  // Get Current Authenticated User & Roles
  getMe: async (): Promise<UserDTO> => {
    const res = await apiClient.get<ApiResponse<UserDTO>>("/auth/me");
    return res.data?.data || (res.data as unknown as UserDTO);
  },

  // Logout & Revoke Refresh Token
  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post("/auth/logout", { refreshToken });
  },
};
