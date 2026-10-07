import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface BackendRoleResponse {
  id: string;
  scope: string;
  scopeId?: string | null;
  name: string;
  description: string;
  badgeCls: string;
  isSystem: boolean;
  permissions: string; // JSON string
  createdBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendStaffResponse {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  roleName: string;
  scope: string;
  merchantId?: string | null;
  merchantName?: string | null;
  storeId?: string | null;
  storeName?: string | null;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  customPermissions?: string;
  lastLoginAt?: string | null;
  createdAt: string;
  inviteUrl?: string;
}

export interface VerifyInviteResponse {
  name: string;
  email: string;
  roleId: string;
  roleName: string;
  scope: string;
}

export interface InviteStaffPayload {
  name: string;
  email: string;
  phone?: string;
  roleId: string;
  scope: "PLATFORM" | "MERCHANT" | "STORE";
  customPermissions?: string;
}

export interface CreateRolePayload {
  id: string;
  scope: "PLATFORM" | "MERCHANT" | "STORE";
  name: string;
  description: string;
  badgeCls?: string;
  permissions: string;
}

export const staffApi = {
  // Get all platform roles from Spring Boot
  getPlatformRoles: async (): Promise<BackendRoleResponse[]> => {
    const res = await apiClient.get<ApiResponse<BackendRoleResponse[]>>("/admin/roles");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Create a platform custom role on Spring Boot
  createPlatformRole: async (payload: CreateRolePayload): Promise<BackendRoleResponse> => {
    const res = await apiClient.post<ApiResponse<BackendRoleResponse>>("/admin/roles", payload);
    return res.data?.data;
  },

  // Get all platform staff members from Spring Boot
  getPlatformStaff: async (): Promise<BackendStaffResponse[]> => {
    const res = await apiClient.get<ApiResponse<BackendStaffResponse[]>>("/admin/staff");
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  // Invite/assign a platform staff member on Spring Boot
  invitePlatformStaff: async (payload: InviteStaffPayload): Promise<BackendStaffResponse> => {
    const res = await apiClient.post<ApiResponse<BackendStaffResponse>>("/admin/staff", payload);
    return res.data?.data;
  },

  // Update staff status (ACTIVE, SUSPENDED) on Spring Boot
  updateStaffStatus: async (staffId: string, status: "ACTIVE" | "SUSPENDED"): Promise<BackendStaffResponse> => {
    const res = await apiClient.patch<ApiResponse<BackendStaffResponse>>(`/admin/staff/${staffId}/status`, { status });
    return res.data?.data;
  },

  // Update staff member role & custom permissions on Spring Boot
  updateStaffRole: async (
    staffId: string,
    roleId: string,
    customPermissions?: string
  ): Promise<BackendStaffResponse> => {
    const res = await apiClient.patch<ApiResponse<BackendStaffResponse>>(`/admin/staff/${staffId}/role`, {
      roleId,
      customPermissions,
    });
    return res.data?.data;
  },

  // Update a platform role's permissions and metadata on Spring Boot
  updatePlatformRole: async (
    roleId: string,
    payload: { name?: string; description?: string; badgeCls?: string; permissions?: string }
  ): Promise<BackendRoleResponse> => {
    const res = await apiClient.put<ApiResponse<BackendRoleResponse>>(`/admin/roles/${roleId}`, payload);
    return res.data?.data;
  },

  // Delete a custom platform role on Spring Boot
  deletePlatformRole: async (roleId: string): Promise<void> => {
    await apiClient.delete(`/admin/roles/${roleId}`);
  },

  // Remove staff member on Spring Boot
  removeStaffMember: async (staffId: string): Promise<void> => {
    await apiClient.delete(`/admin/staff/${staffId}`);
  },

  // Verify one-time staff invitation token
  verifyInviteToken: async (token: string): Promise<VerifyInviteResponse> => {
    const res = await apiClient.get<ApiResponse<VerifyInviteResponse>>(`/auth/invite/verify?token=${encodeURIComponent(token)}`);
    return res.data?.data;
  },

  // Accept staff invitation, establish credentials, and activate account
  acceptInvite: async (payload: { token: string; password: string }): Promise<BackendStaffResponse> => {
    const res = await apiClient.post<ApiResponse<BackendStaffResponse>>("/auth/invite/accept", payload);
    return res.data?.data;
  },

  // Merchant & Store Scoped APIs
  getMerchantRoles: async (scope?: string, scopeId?: string): Promise<BackendRoleResponse[]> => {
    const params = new URLSearchParams();
    if (scope) params.append("scope", scope);
    if (scopeId) params.append("scopeId", scopeId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<ApiResponse<BackendRoleResponse[]>>(`/merchant/roles${query}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  createMerchantRole: async (payload: CreateRolePayload & { scopeId?: string }): Promise<BackendRoleResponse> => {
    const res = await apiClient.post<ApiResponse<BackendRoleResponse>>("/merchant/roles", payload);
    return res.data?.data;
  },

  updateMerchantRole: async (
    roleId: string,
    payload: { name?: string; description?: string; badgeCls?: string; permissions?: string }
  ): Promise<BackendRoleResponse> => {
    const res = await apiClient.put<ApiResponse<BackendRoleResponse>>(`/merchant/roles/${roleId}`, payload);
    return res.data?.data;
  },

  deleteMerchantRole: async (roleId: string): Promise<void> => {
    await apiClient.delete(`/merchant/roles/${roleId}`);
  },

  getMerchantStaff: async (scope?: string, scopeId?: string): Promise<BackendStaffResponse[]> => {
    const params = new URLSearchParams();
    if (scope) params.append("scope", scope);
    if (scopeId) params.append("scopeId", scopeId);
    const query = params.toString() ? `?${params.toString()}` : "";
    const res = await apiClient.get<ApiResponse<BackendStaffResponse[]>>(`/merchant/staff${query}`);
    return Array.isArray(res.data?.data) ? res.data.data : [];
  },

  inviteMerchantStaff: async (payload: InviteStaffPayload): Promise<BackendStaffResponse> => {
    const res = await apiClient.post<ApiResponse<BackendStaffResponse>>("/merchant/staff", payload);
    return res.data?.data;
  },

  updateMerchantStaffStatus: async (staffId: string, status: "ACTIVE" | "SUSPENDED"): Promise<BackendStaffResponse> => {
    const res = await apiClient.patch<ApiResponse<BackendStaffResponse>>(`/merchant/staff/${staffId}/status`, { status });
    return res.data?.data;
  },

  updateMerchantStaffRole: async (
    staffId: string,
    roleId: string,
    customPermissions?: string
  ): Promise<BackendStaffResponse> => {
    const res = await apiClient.patch<ApiResponse<BackendStaffResponse>>(`/merchant/staff/${staffId}/role`, {
      roleId,
      customPermissions,
    });
    return res.data?.data;
  },

  removeMerchantStaff: async (staffId: string): Promise<void> => {
    await apiClient.delete(`/merchant/staff/${staffId}`);
  },
};
