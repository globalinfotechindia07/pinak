import apiClient from "./client";
import {
  CategoryDTO,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from "../types/api/category.dto";
import { ApiResponse } from "../types/api/common";

export const categoryApi = {
  // Get All Categories (Hierarchy Tree) - public/discovery or admin
  getCategories: async (): Promise<CategoryDTO[]> => {
    try {
      const res = await apiClient.get<ApiResponse<CategoryDTO[]>>("/categories");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    } catch {
      // Fallback to /discovery/categories if /categories requires admin
      const res = await apiClient.get<ApiResponse<CategoryDTO[]>>("/discovery/categories");
      return Array.isArray(res.data) ? res.data : (res.data?.data || []);
    }
  },

  // Get Admin Categories
  getAdminCategories: async (): Promise<CategoryDTO[]> => {
    const res = await apiClient.get<ApiResponse<CategoryDTO[]>>("/admin/categories");
    return Array.isArray(res.data) ? res.data : (res.data?.data || []);
  },

  // Get Category by ID
  getCategoryById: async (id: string): Promise<CategoryDTO> => {
    const res = await apiClient.get<ApiResponse<CategoryDTO>>(`/categories/${id}`);
    return res.data?.data || (res.data as unknown as CategoryDTO);
  },

  // Create Category (Admin Only: /admin/categories)
  createCategory: async (payload: CreateCategoryRequest): Promise<CategoryDTO> => {
    const res = await apiClient.post<ApiResponse<CategoryDTO>>("/admin/categories", payload);
    return res.data?.data || (res.data as unknown as CategoryDTO);
  },

  // Update Category (Admin Only)
  updateCategory: async (id: string, payload: UpdateCategoryRequest): Promise<CategoryDTO> => {
    const res = await apiClient.put<ApiResponse<CategoryDTO>>(`/admin/categories/${id}`, payload);
    return res.data?.data || (res.data as unknown as CategoryDTO);
  },

  // Update Category Status
  updateCategoryStatus: async (id: string, status: "ACTIVE" | "INACTIVE"): Promise<void> => {
    await apiClient.patch(`/admin/categories/${id}/status`, { status });
  },

  // Delete Category
  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/categories/${id}`);
  },
};
