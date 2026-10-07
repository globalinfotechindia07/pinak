import apiClient from "./client";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export interface UserSummaryItem {
  id: string;
  phone?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role: string;
  status: string;
  profileCompleted?: boolean;
  mobile?: string;
  emailVerified?: boolean;
  profilePictureUrl?: string;
  createdAt?: string;
}

export interface AuditLogItem {
  id: string;
  adminUserId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  oldValue?: string;
  newValue?: string;
  reason?: string;
  requestId?: string;
  ipAddress?: string;
  createdAt: string;
}

export interface AdminDashboardMetrics {
  users: { total: number; active: number; inactive: number };
  merchants: { total: number; pendingApproval: number; active: number; suspended: number };
  stores: { total: number; pendingApproval: number; active: number };
  offers: { total: number; pendingApproval: number; active: number; expired: number };
  transactions: { total: number; successful: number; pending: number; failed: number; refunded: number };
  timestamp?: string;
}

export const adminApi = {
  // Live Operational Dashboard Metrics
  getDashboardSummary: async (): Promise<AdminDashboardMetrics | null> => {
    try {
      const res = await apiClient.get<ApiResponse<AdminDashboardMetrics>>("/admin/dashboard");
      return res.data?.data || null;
    } catch (err) {
      console.warn("[Admin API] Failed to fetch dashboard metrics:", err);
      return null;
    }
  },

  // Live Users Listing with Role Filtering
  getUsers: async (params?: PaginationParams & { role?: string; status?: string; search?: string }): Promise<UserSummaryItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<UserSummaryItem>>>("/admin/users", { params });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "content" in data && Array.isArray((data as any).content)) return (data as any).content;
      return [];
    } catch (err) {
      console.warn("[Admin API] Failed to fetch admin users:", err);
      return [];
    }
  },

  // Live System Audit Logs
  getAuditLogs: async (params?: PaginationParams): Promise<AuditLogItem[]> => {
    try {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<AuditLogItem>>>("/admin/audit-logs", { params });
      const data = res.data?.data;
      if (Array.isArray(data)) return data;
      if (data && "content" in data && Array.isArray((data as any).content)) return (data as any).content;
      return [];
    } catch (err) {
      console.warn("[Admin API] Failed to fetch audit logs:", err);
      return [];
    }
  },

  // Update user status
  updateUserStatus: async (userId: string, status: "ACTIVE" | "SUSPENDED" | "BLOCKED", reason?: string): Promise<UserSummaryItem> => {
    const res = await apiClient.patch<ApiResponse<UserSummaryItem>>(`/admin/users/${userId}/status`, { status, reason: reason || "Admin action" });
    return res.data?.data;
  },

  // Update user role
  updateUserRole: async (userId: string, role: string): Promise<UserSummaryItem> => {
    const res = await apiClient.patch<ApiResponse<UserSummaryItem>>(`/admin/users/${userId}/role`, { role });
    return res.data?.data;
  },
};
