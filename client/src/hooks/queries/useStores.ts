import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storeApi } from "../../api/storeApi";
import {
  CreateStoreRequest,
  StoreDTO,
  StoreStatus,
  UpdateStoreRequest,
} from "../../types/api/store.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";

export const MY_STORES_QUERY_KEY = ["stores", "my-stores"];

export function useStores() {
  const queryClient = useQueryClient();

  // Query: Fetch all branches for active merchant
  const myStoresQuery = useQuery({
    queryKey: MY_STORES_QUERY_KEY,
    queryFn: storeApi.getMyStores,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Create Store Branch with GPS Coordinates
  const createStoreMutation = useMutation({
    mutationFn: (payload: CreateStoreRequest) => storeApi.createStore(payload),
    onSuccess: (newStore) => {
      queryClient.invalidateQueries({ queryKey: MY_STORES_QUERY_KEY });
      toast.success(`Store branch "${newStore.storeName}" registered successfully!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to create store branch");
    },
  });

  // Mutation: Update Store Details
  const updateStoreMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateStoreRequest }) =>
      storeApi.updateStore(id, payload),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: MY_STORES_QUERY_KEY });
      toast.success(`Branch "${updated.storeName}" updated!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to update store");
    },
  });

  // Mutation: Instant Optimistic Status Toggle (Zero-Lag UX)
  const toggleStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StoreStatus }) =>
      storeApi.updateStoreStatus(id, status),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: MY_STORES_QUERY_KEY });
      const previousStores = queryClient.getQueryData<StoreDTO[]>(MY_STORES_QUERY_KEY);

      if (previousStores) {
        queryClient.setQueryData<StoreDTO[]>(
          MY_STORES_QUERY_KEY,
          previousStores.map((s) => (s.id === id ? { ...s, status } : s))
        );
      }

      return { previousStores };
    },
    onError: (err, _, context) => {
      if (context?.previousStores) {
        queryClient.setQueryData(MY_STORES_QUERY_KEY, context.previousStores);
      }
      handleApiErrorToast(err, "Failed to update store operational status");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORES_QUERY_KEY });
    },
  });

  // Mutation: Delete Merchant Store
  const deleteStoreMutation = useMutation({
    mutationFn: (id: string) => storeApi.deleteMerchantStore(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_STORES_QUERY_KEY });
      toast.success("Store branch outlet deleted successfully");
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to delete store branch");
    },
  });

  // Mutation: Resend Manager Invite
  const resendInviteMutation = useMutation({
    mutationFn: (id: string) => storeApi.resendManagerInvite(id),
    onSuccess: () => {
      toast.success("Manager activation link resent successfully!");
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to resend manager activation link");
    },
  });

  return {
    stores: myStoresQuery.data || [],
    isLoading: myStoresQuery.isLoading,
    isRefetching: myStoresQuery.isRefetching,
    error: myStoresQuery.error,
    createStore: createStoreMutation.mutateAsync,
    isCreating: createStoreMutation.isPending,
    updateStore: updateStoreMutation.mutateAsync,
    isUpdating: updateStoreMutation.isPending,
    deleteStore: deleteStoreMutation.mutateAsync,
    isDeleting: deleteStoreMutation.isPending,
    resendManagerInvite: resendInviteMutation.mutateAsync,
    isResendingInvite: resendInviteMutation.isPending,
    toggleStatus: toggleStatusMutation.mutateAsync,
    refetch: myStoresQuery.refetch,
  };
}
