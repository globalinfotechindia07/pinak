import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { merchantApi } from "../../api/merchantApi";
import {
  MerchantProfileDTO,
  RegisterMerchantRequest,
  UpdateMerchantProfileRequest,
} from "../../types/api/merchant.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";

export const MERCHANT_PROFILE_QUERY_KEY = ["merchant", "profile"];

export function useMerchant() {
  const queryClient = useQueryClient();

  // Query: Get Authenticated Merchant Profile
  const profileQuery = useQuery({
    queryKey: MERCHANT_PROFILE_QUERY_KEY,
    queryFn: merchantApi.getProfile,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Merchant Self-Registration
  const registerMutation = useMutation({
    mutationFn: (payload: RegisterMerchantRequest) => merchantApi.register(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(MERCHANT_PROFILE_QUERY_KEY, data);
      toast.success("Merchant registration submitted for KYC verification!");
    },
    onError: (err) => {
      handleApiErrorToast(err, "Registration Failed");
    },
  });

  // Mutation: Update Profile & Bank UPI VPA
  const updateProfileMutation = useMutation({
    mutationFn: (payload: UpdateMerchantProfileRequest) =>
      merchantApi.updateProfile(payload),
    onSuccess: (data) => {
      queryClient.setQueryData(MERCHANT_PROFILE_QUERY_KEY, data);
      toast.success("Merchant profile and UPI VPA updated!");
    },
    onError: (err) => {
      handleApiErrorToast(err, "Profile update failed");
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    isRefetching: profileQuery.isRefetching,
    error: profileQuery.error,
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    updateProfile: updateProfileMutation.mutateAsync,
    isUpdatingProfile: updateProfileMutation.isPending,
    refetch: profileQuery.refetch,
  };
}
