import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "../../api/storeApi";
import { CreateStoreRequest, StoreDTO } from "../../types/api/store.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";
import { useState } from "react";

export const ADMIN_STORES_QUERY_KEY = ["admin", "stores"];

export interface UseAdminStoresFilter {
  page?: number;
  size?: number;
  cityId?: string;
  status?: string;
  approvalStatus?: string;
}

export function useAdminStores(initialFilters: UseAdminStoresFilter = {}) {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<UseAdminStoresFilter>({
    page: 0,
    size: 20,
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: [...ADMIN_STORES_QUERY_KEY, filters],
    queryFn: () => storeApi.getAllStoresAdmin(filters),
    staleTime: 60 * 1000,
  });

  // Mutation: Approve Store
  const approveMutation = useMutation({
    mutationFn: (id: string) => storeApi.approveStoreAdmin(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      toast.success(`Store branch approved and marked ACTIVE on map!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to approve store branch");
    },
  });

  // Mutation: Reject Store with Reason
  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      storeApi.rejectStoreAdmin(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      toast.error(`Store branch application rejected.`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to reject store branch");
    },
  });

  // Mutation: Suspend Store with Reason
  const suspendMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      storeApi.suspendStoreAdmin(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      toast.warning(`Store branch has been suspended.`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to suspend store branch");
    },
  });

  // Mutation: Reactivate Store
  const activateMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      storeApi.activateStoreAdmin(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      toast.success(`Store branch reactivated successfully.`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to reactivate store branch");
    },
  });

  // Mutation: Universal Create Store Branch
  const createStoreMutation = useMutation({
    mutationFn: (payload: CreateStoreRequest) => storeApi.createStore(payload),
    onSuccess: (newStore) => {
      queryClient.invalidateQueries({ queryKey: ADMIN_STORES_QUERY_KEY });
      toast.success(`Store branch "${newStore.storeName}" registered successfully!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to create store branch");
    },
  });

  return {
    data: query.data,
    stores: query.data?.content || [],
    totalElements: query.data?.totalElements || 0,
    totalPages: query.data?.totalPages || 0,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    filters,
    setFilters,
    approveStore: approveMutation.mutateAsync,
    isApproving: approveMutation.isPending,
    rejectStore: rejectMutation.mutateAsync,
    isRejecting: rejectMutation.isPending,
    suspendStore: suspendMutation.mutateAsync,
    isSuspending: suspendMutation.isPending,
    activateStore: activateMutation.mutateAsync,
    isActivating: activateMutation.isPending,
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
    refetch: query.refetch,
  };
}
