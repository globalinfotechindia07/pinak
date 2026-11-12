import apiClient from "./client";
import { ApiResponse, PaginatedResponse, PaginationParams } from "../types/api/common";

export interface CustomerDirectoryItem {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;
  city?: string;
  primaryCity?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  referralCode?: string;
  referredByCode?: string;
  profileCompleted: boolean;
  status: "ACTIVE" | "SUSPENDED" | string;
  visits: number;
  totalSpend: number;
  rewardsBalance: number;
  tier: "BRONZE" | "SILVER" | "GOLD" | "VIP" | string;
  segment: "Power user" | "Regular" | "New" | string;
  createdAt: string;
  lastActive: string;
  initials: string;
}

export interface CustomerStats {
  totalCustomers: number;
  activeCustomers: number;
  suspendedCustomers: number;
  powerUsers: number;
  totalPlatformSpend: number;
  totalCoinsCirculating: number;
  avgSpendPerCustomer: number;
}

export interface CustomerRewardWallet {
  customerId: string;
  pointsBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  tier: string;
  cashEquivalentInr: number;
  multiplier: number;
  status: string;
}

export interface CustomerTransaction {
  id: string;
  transactionReference: string;
  storeName: string;
  amount: number;
  discountAmount: number;
  payableAmount: number;
  pointsAwarded: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface CustomerBooking {
  id: string;
  bookingRef: string;
  storeName: string;
  bookingDate: string;
  slotTime: string;
  guests: number;
  totalPaid: number;
  billAmount: number;
  coinsEarned: number;
  verificationCode?: string;
  status: string;
  createdAt: string;
}

export interface CustomerRedemption {
  id: string;
  voucherCode: string;
  offerTitle: string;
  storeName: string;
  discountAmount: number;
  finalAmount: number;
  status: string;
  createdAt: string;
}

export interface CustomerDetailResponse {
  profile: CustomerDirectoryItem;
  rewardWallet: CustomerRewardWallet;
  recentTransactions: CustomerTransaction[];
  recentBookings: CustomerBooking[];
  recentRedemptions: CustomerRedemption[];
}

export interface CreateCustomerPayload {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  state?: string;
  district?: string;
  pincode?: string;
  address?: string;
  gender?: string;
  birthday?: string;
  referralCode?: string;
  initialBonusCoins?: number;
}

export interface CustomerFilterParams extends PaginationParams {
  search?: string;
  status?: string;
  segment?: string;
  city?: string;
}

export const customerApi = {
  // 1. Get Customer Directory (Paginated with Real Database Data)
  getCustomers: async (params?: CustomerFilterParams): Promise<{ customers: CustomerDirectoryItem[]; total: number }> => {
    try {
      const res = await apiClient.get<ApiResponse<PaginatedResponse<CustomerDirectoryItem>>>("/admin/customers", { params });
      const data = res.data?.data;
      if (data && "content" in data && Array.isArray((data as any).content)) {
        return {
          customers: (data as any).content,
          total: (data as any).totalElements || (data as any).content.length
        };
      }
      if (Array.isArray(data)) {
        return { customers: data, total: data.length };
      }
      return { customers: [], total: 0 };
    } catch (err) {
      console.warn("[Customer API] Failed to fetch customer directory:", err);
      return { customers: [], total: 0 };
    }
  },

  // 2. Get Platform-wide Customer Aggregate Statistics
  getStats: async (): Promise<CustomerStats | null> => {
    try {
      const res = await apiClient.get<ApiResponse<CustomerStats>>("/admin/customers/stats");
      return res.data?.data || null;
    } catch (err) {
      console.warn("[Customer API] Failed to fetch customer stats:", err);
      return null;
    }
  },

  // 3. Get Full Customer Detail Dossier
  getDetails: async (customerId: string): Promise<CustomerDetailResponse | null> => {
    try {
      const res = await apiClient.get<ApiResponse<CustomerDetailResponse>>(`/admin/customers/${customerId}/details`);
      return res.data?.data || null;
    } catch (err) {
      console.warn(`[Customer API] Failed to fetch details for customer ${customerId}:`, err);
      return null;
    }
  },

  // 4. Update Customer Account Status (ACTIVE or SUSPENDED)
  updateStatus: async (customerId: string, status: "ACTIVE" | "SUSPENDED", reason?: string): Promise<CustomerDirectoryItem> => {
    const res = await apiClient.patch<ApiResponse<CustomerDirectoryItem>>(`/admin/customers/${customerId}/status`, {
      status,
      reason: reason || "Admin moderation action"
    });
    return res.data?.data;
  },

  // 5. Adjust Loyalty Reward Points
  adjustPoints: async (customerId: string, pointsDelta: number, reason: string): Promise<CustomerRewardWallet> => {
    const res = await apiClient.post<ApiResponse<CustomerRewardWallet>>(`/admin/customers/${customerId}/rewards/adjust`, {
      pointsDelta,
      reason
    });
    return res.data?.data;
  },

  // 6. Create / Register New Customer
  createCustomer: async (payload: CreateCustomerPayload): Promise<CustomerDirectoryItem> => {
    const res = await apiClient.post<ApiResponse<CustomerDirectoryItem>>("/admin/customers", payload);
    return res.data?.data;
  }
};
