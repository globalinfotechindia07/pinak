import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../api/authApi";
import {
  setStoredTokens,
  clearStoredTokens,
  getStoredRefreshToken,
} from "../../api/interceptors";
import { LoginRequest, OtpRequest, VerifyOtpRequest } from "../../types/api/auth.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";

export const AUTH_QUERY_KEY = ["auth", "currentUser"];

export function useAuth() {
  const queryClient = useQueryClient();

  // Query: Get current authenticated user profile
  const currentUserQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: authApi.getMe,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: false,
  });

  // Mutation: Password / Phone Login
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
      setStoredTokens(data.tokens.accessToken, data.tokens.refreshToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      toast.success(`Welcome back, ${data.user.name || data.user.email}!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Login Failed");
    },
  });

  // Mutation: Request OTP
  const requestOtpMutation = useMutation({
    mutationFn: (payload: OtpRequest) => authApi.requestOtp(payload),
    onSuccess: (res) => {
      toast.success(res.message || "OTP sent successfully to your phone.");
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to send OTP");
    },
  });

  // Mutation: Verify OTP
  const verifyOtpMutation = useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authApi.verifyOtp(payload),
    onSuccess: (data) => {
      setStoredTokens(data.tokens.accessToken, data.tokens.refreshToken);
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      toast.success("Phone verified successfully!");
    },
    onError: (err) => {
      handleApiErrorToast(err, "OTP Verification Failed");
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: () => {
      const refreshToken = getStoredRefreshToken() || undefined;
      return authApi.logout(refreshToken);
    },
    onSettled: () => {
      clearStoredTokens();
      queryClient.clear();
      toast.info("You have been signed out.");
    },
  });

  return {
    currentUser: currentUserQuery.data,
    isLoadingUser: currentUserQuery.isLoading,
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    requestOtp: requestOtpMutation.mutateAsync,
    isRequestingOtp: requestOtpMutation.isPending,
    verifyOtp: verifyOtpMutation.mutateAsync,
    isVerifyingOtp: verifyOtpMutation.isPending,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
