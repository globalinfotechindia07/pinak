import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface NotificationDTO {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "TRANSACTION" | "OFFER" | "MERCHANT" | "SYSTEM" | "REWARD";
  isRead: boolean;
  createdAt: string;
  data?: Record<string, any>;
}

export interface NotificationPageResponse {
  content: NotificationDTO[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  unreadCount: number;
}

export const notificationApi = {
  // Fetch real notifications for the authenticated user
  async getNotifications(params?: {
    isRead?: boolean;
    type?: string;
    page?: number;
    size?: number;
  }): Promise<NotificationPageResponse> {
    const res = await apiClient.get<ApiResponse<NotificationPageResponse>>("/notifications", {
      params: {
        page: params?.page ?? 0,
        size: params?.size ?? 25,
        ...(params?.isRead !== undefined ? { isRead: params.isRead } : {}),
        ...(params?.type ? { type: params.type } : {}),
      },
    });
    return res.data.data;
  },

  // Mark single notification as read on backend
  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read for current user
  async markAllAsRead(): Promise<void> {
    await apiClient.patch("/notifications/read-all");
  },

  // Fetch real-time unread count
  async getUnreadCount(): Promise<number> {
    const res = await apiClient.get<ApiResponse<{ unreadCount: number }>>("/notifications/unread-count");
    return res.data?.data?.unreadCount ?? 0;
  },
};
