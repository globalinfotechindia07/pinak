import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../../api/authApi";
import { tokenManager } from "../../api/tokenManager";
import { authChannel } from "../../api/authChannel";
import { LoginRequest, OtpRequest, VerifyOtpRequest } from "../../types/api/auth.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";

export const AUTH_QUERY_KEY = ["auth", "currentUser"];

export function useAuth() {
  const queryClient = useQueryClient();

  // Multi-tab sync subscription
  useEffect(() => {
    const unsubscribe = authChannel.subscribe((msg) => {
      if (msg.type === "AUTH_LOGOUT" || msg.type === "AUTH_EXPIRED") {
        tokenManager.clearAccessToken();
        queryClient.setQueryData(AUTH_QUERY_KEY, null);
        toast.info("Session expired or signed out in another tab.");
      } else if (msg.type === "AUTH_LOGIN") {
        queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY });
      }
    });

    const handleUnauthorized = () => {
      tokenManager.clearAccessToken();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
    };

    window.addEventListener("pinak:unauthorized", handleUnauthorized);

    return () => {
      unsubscribe();
      window.removeEventListener("pinak:unauthorized", handleUnauthorized);
    };
  }, [queryClient]);

  // Query: Get current authenticated user profile
  const currentUserQuery = useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      if (!tokenManager.hasAccessToken()) {
        // Attempt silent session restoration via HttpOnly cookie
        const bootUser = await authApi.bootstrapSession();
        return bootUser;
      }
      return authApi.getMe();
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // Mutation: Password / Phone Login
  const loginMutation = useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
    onSuccess: (data) => {
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
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
      toast.success("Phone verified successfully!");
    },
    onError: (err) => {
      handleApiErrorToast(err, "OTP Verification Failed");
    },
  });

  // Mutation: Logout
  const logoutMutation = useMutation({
    mutationFn: (sessionId?: string) => authApi.logout(sessionId),
    onSettled: () => {
      tokenManager.clearAccessToken();
      queryClient.setQueryData(AUTH_QUERY_KEY, null);
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

export default useAuth;
