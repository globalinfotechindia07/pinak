import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { categoryApi } from "../../api/categoryApi";
import { CategoryDTO, CreateCategoryRequest, UpdateCategoryRequest } from "../../types/api/category.dto";
import { handleApiErrorToast } from "../../api/error";
import { toast } from "sonner";

export const CATEGORIES_QUERY_KEY = ["categories", "list"];

export function useCategories() {
  const queryClient = useQueryClient();

  // Query: Get All Categories (with 5-minute background caching)
  const categoriesQuery = useQuery({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: categoryApi.getCategories,
    staleTime: 5 * 60 * 1000,
  });

  // Mutation: Create Category
  const createCategoryMutation = useMutation({
    mutationFn: (payload: CreateCategoryRequest) => categoryApi.createCategory(payload),
    onSuccess: (newCat) => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success(`Category "${newCat.name}" created successfully!`);
    },
    onError: (err) => {
      handleApiErrorToast(err, "Failed to create category");
    },
  });

  // Mutation: Update Category with Optimistic UI
  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryRequest }) =>
      categoryApi.updateCategory(id, payload),
    onMutate: async ({ id, payload }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY });
      // Snapshot previous value
      const previousCategories = queryClient.getQueryData<CategoryDTO[]>(CATEGORIES_QUERY_KEY);

      // Optimistically update
      if (previousCategories) {
        queryClient.setQueryData<CategoryDTO[]>(
          CATEGORIES_QUERY_KEY,
          previousCategories.map((cat) =>
            cat.id === id ? { ...cat, ...payload } : cat
          )
        );
      }

      return { previousCategories };
    },
    onError: (err, _, context) => {
      // Rollback on error
      if (context?.previousCategories) {
        queryClient.setQueryData(CATEGORIES_QUERY_KEY, context.previousCategories);
      }
      handleApiErrorToast(err, "Failed to update category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
    },
  });

  // Mutation: Delete Category with Optimistic Removal
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryApi.deleteCategory(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: CATEGORIES_QUERY_KEY });
      const previousCategories = queryClient.getQueryData<CategoryDTO[]>(CATEGORIES_QUERY_KEY);

      if (previousCategories) {
        queryClient.setQueryData<CategoryDTO[]>(
          CATEGORIES_QUERY_KEY,
          previousCategories.filter((c) => c.id !== id)
        );
      }

      return { previousCategories };
    },
    onError: (err, _, context) => {
      if (context?.previousCategories) {
        queryClient.setQueryData(CATEGORIES_QUERY_KEY, context.previousCategories);
      }
      handleApiErrorToast(err, "Failed to delete category");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORIES_QUERY_KEY });
      toast.success("Category deleted.");
    },
  });

  return {
    categories: categoriesQuery.data || [],
    isLoading: categoriesQuery.isLoading,
    isRefetching: categoriesQuery.isRefetching,
    error: categoriesQuery.error,
    createCategory: createCategoryMutation.mutateAsync,
    isCreating: createCategoryMutation.isPending,
    updateCategory: updateCategoryMutation.mutateAsync,
    isUpdating: updateCategoryMutation.isPending,
    deleteCategory: deleteCategoryMutation.mutateAsync,
    isDeleting: deleteCategoryMutation.isPending,
    refetch: categoriesQuery.refetch,
  };
}
