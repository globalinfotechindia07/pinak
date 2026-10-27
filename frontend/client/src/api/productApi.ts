import apiClient from "./client";
import { CreateProductRequest, ProductDTO, UpdateProductRequest } from "../types/api/product.dto";
import { ApiResponse } from "../types/api/common";

export const productApi = {
  // Get all products / dishes for a store branch
  getProductsByStore: async (storeId: string): Promise<ProductDTO[]> => {
    try {
      const res = await apiClient.get<ApiResponse<ProductDTO[]>>(`/products/store/${storeId}`);
      return res.data?.data || [];
    } catch (err) {
      console.error("Failed to load products for store:", err);
      return [];
    }
  },

  // Get all products for a merchant
  getProductsByMerchant: async (merchantId: string): Promise<ProductDTO[]> => {
    try {
      const res = await apiClient.get<ApiResponse<ProductDTO[]>>(`/products/merchant/${merchantId}`);
      return res.data?.data || [];
    } catch (err) {
      console.error("Failed to load products for merchant:", err);
      return [];
    }
  },

  // Get product by ID
  getProductById: async (id: string): Promise<ProductDTO | null> => {
    try {
      const res = await apiClient.get<ApiResponse<ProductDTO>>(`/products/${id}`);
      return res.data?.data || null;
    } catch (err) {
      console.error("Failed to load product:", err);
      return null;
    }
  },

  // Create product or food dish
  createProduct: async (payload: CreateProductRequest): Promise<ProductDTO> => {
    const res = await apiClient.post<ApiResponse<ProductDTO>>("/products", payload);
    return res.data?.data;
  },

  // Update product or food dish
  updateProduct: async (id: string, payload: UpdateProductRequest): Promise<ProductDTO> => {
    const res = await apiClient.put<ApiResponse<ProductDTO>>(`/products/${id}`, payload);
    return res.data?.data;
  },

  // Delete product or food dish
  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete(`/products/${id}`);
  },
};

export default productApi;
