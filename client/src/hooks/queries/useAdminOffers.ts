import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { offerApi } from "../../api/offerApi";
import { AdminOfferFilterParams, CreateOfferRequest, OfferDTO } from "../../types/api/offer.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";
import { useState } from "react";

export const ADMIN_OFFERS_QUERY_KEY = ["admin", "offers"];

export function useAdminOffers(initialFilters: AdminOfferFilterParams = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AdminOfferFilterParams>({
    page: 0,
    size: 20,
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: [...ADMIN_OFFERS_QUERY_KEY, filters],
    queryFn: () => offerApi.getAdminOffers(filters),
    staleTime: 60 * 1000,
  });

  // Mutation: Approve Offer
  const approveMutation = useMutation({
    mutationFn: (offerId: string) => offerApi.approveOfferAdmin(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_OFFERS_QUERY_KEY });
      toast.success(`Offer approved and live on customer discovery!`);
    },
    onError: (err: any) => {
      handleApiErrorToast(err, "Failed to approve offer");
    },
  });

  // Mutation: Reject Offer
  const rejectMutation = useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason: string }) =>
      offerApi.rejectOfferAdmin(offerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_OFFERS_QUERY_KEY });
      toast.error(`Offer campaign application rejected.`);
    },
    onError: (err: any) => {
      handleApiErrorToast(err, "Failed to reject offer");
    },
  });

  // Mutation: Suspend Offer
  const suspendMutation = useMutation({
    mutationFn: ({ offerId, reason }: { offerId: string; reason: string }) =>
      offerApi.suspendOfferAdmin(offerId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_OFFERS_QUERY_KEY });
      toast.warning(`Offer campaign suspended.`);
    },
    onError: (err: any) => {
      handleApiErrorToast(err, "Failed to suspend offer campaign");
    },
  });

  // Mutation: Create Offer
  const createOfferMutation = useMutation({
    mutationFn: (payload: CreateOfferRequest) => offerApi.createOffer(payload),
    onSuccess: (newOffer) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_OFFERS_QUERY_KEY });
      toast.success(`Platform offer "${newOffer.title}" created successfully!`);
    },
    onError: (err: any) => {
      handleApiErrorToast(err, "Failed to create campaign offer");
    },
  });

  return {
    data: query.data,
    offers: query.data?.content || [],
    totalElements: query.data?.totalElements || 0,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    filters,
    setFilters,
    approveOffer: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectOffer: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    suspendOffer: suspendMutation.mutateAsync,
    isSuspending: suspendMutation.isPending,
    createOffer: createOfferMutation.mutateAsync,
    isCreating: createOfferMutation.isPending,
    refetch: query.refetch,
  };
}
