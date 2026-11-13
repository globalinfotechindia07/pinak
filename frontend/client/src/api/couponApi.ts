import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface CouponItem {
  id: string;
  code: string;
  title?: string;
  headline: string;
  description: string;
  badgeText: string;
  discountType?: "PERCENTAGE" | "FLAT" | string;
  discountValue?: number;
  maxDiscount?: number;
  minBill?: number;
  partnerBank?: string;
  paymentMethodRequired?: string;
  terms: string[];
  isAutoApplicable?: boolean;
  isEligible?: boolean;
  savingsEstimate?: number;
  flatDiscount?: number;
  discountPct?: number;
}

export interface ApplicableCouponsResponse {
  totalCoupons: number;
  autoApplicableCoupon: CouponItem | null;
  coupons: CouponItem[];
}

export interface ValidateCouponRequest {
  code: string;
  billAmount: number;
  storeId?: string;
  paymentMethod?: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  code: string;
  message: string;
  discountAmount: number;
  finalPayableAmount: number;
  coupon: CouponItem | null;
}

export interface AdminCoupon {
  id: string;
  code: string;
  title: string;
  headline: string;
  description: string;
  badgeText: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minBillAmount: number;
  partnerBank?: string;
  paymentMethodRequired?: string;
  terms: string;
  storeId?: string;
  merchantId?: string;
  categoryId?: string;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  currentUsageCount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  isAutoApplicable: boolean;
  displayOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaveCouponPayload {
  code: string;
  title: string;
  headline?: string;
  description?: string;
  badgeText?: string;
  discountType: "PERCENTAGE" | "FLAT";
  discountValue: number;
  maxDiscount?: number;
  minBillAmount?: number;
  partnerBank?: string;
  paymentMethodRequired?: string;
  terms?: string;
  storeId?: string;
  merchantId?: string;
  categoryId?: string;
  usageLimitTotal?: number;
  usageLimitPerUser?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
  isAutoApplicable?: boolean;
  displayOrder?: number;
}

export const couponApi = {
  // Fetch real active coupons & payment offers from PostgreSQL
  getApplicableCoupons: async (storeId?: string, billAmount?: number): Promise<ApplicableCouponsResponse> => {
    try {
      const res = await apiClient.get<ApiResponse<ApplicableCouponsResponse>>("/coupons/applicable", {
        params: {
          storeId: storeId || undefined,
          billAmount: billAmount || undefined
        }
      });
      const data = res.data?.data;
      if (data && Array.isArray(data.coupons)) {
        // Normalize fields for UI compatibility
        const normalizedCoupons = data.coupons.map((c) => ({
          ...c,
          flatDiscount: c.discountType === "FLAT" ? c.discountValue : undefined,
          discountPct: c.discountType === "PERCENTAGE" ? c.discountValue : undefined,
        }));
        return {
          totalCoupons: data.totalCoupons || normalizedCoupons.length,
          autoApplicableCoupon: data.autoApplicableCoupon ? {
            ...data.autoApplicableCoupon,
            flatDiscount: data.autoApplicableCoupon.discountType === "FLAT" ? data.autoApplicableCoupon.discountValue : undefined,
            discountPct: data.autoApplicableCoupon.discountType === "PERCENTAGE" ? data.autoApplicableCoupon.discountValue : undefined,
          } : null,
          coupons: normalizedCoupons
        };
      }
      return { totalCoupons: 0, autoApplicableCoupon: null, coupons: [] };
    } catch (err) {
      console.warn("[Coupon API] Failed to fetch applicable coupons:", err);
      return { totalCoupons: 0, autoApplicableCoupon: null, coupons: [] };
    }
  },

  // Validate coupon against database rules (min spend, usage limits, expiration, etc.)
  validateCoupon: async (payload: ValidateCouponRequest): Promise<ValidateCouponResponse> => {
    try {
      const res = await apiClient.post<ApiResponse<ValidateCouponResponse>>("/coupons/validate", payload);
      const data = res.data?.data;
      if (data) {
        if (data.coupon) {
          data.coupon.flatDiscount = data.coupon.discountType === "FLAT" ? data.coupon.discountValue : undefined;
          data.coupon.discountPct = data.coupon.discountType === "PERCENTAGE" ? data.coupon.discountValue : undefined;
        }
        return data;
      }
      return {
        valid: false,
        code: payload.code,
        message: "Failed to validate coupon.",
        discountAmount: 0,
        finalPayableAmount: payload.billAmount,
        coupon: null
      };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || "Failed to validate coupon.";
      return {
        valid: false,
        code: payload.code,
        message: msg,
        discountAmount: 0,
        finalPayableAmount: payload.billAmount,
        coupon: null
      };
    }
  },

  // ==========================================
  // ADMIN PORTAL COUPON MANAGEMENT
  // ==========================================

  adminGetAll: async (): Promise<AdminCoupon[]> => {
    try {
      const res = await apiClient.get<ApiResponse<AdminCoupon[]>>("/admin/coupons");
      return res.data?.data || [];
    } catch (err) {
      console.warn("[Coupon API] Failed to fetch admin coupons:", err);
      return [];
    }
  },

  adminCreate: async (payload: SaveCouponPayload): Promise<AdminCoupon> => {
    const res = await apiClient.post<ApiResponse<AdminCoupon>>("/admin/coupons", payload);
    if (!res.data?.data) {
      throw new Error(res.data?.message || "Failed to create coupon");
    }
    return res.data.data;
  },

  adminUpdate: async (id: string, payload: SaveCouponPayload): Promise<AdminCoupon> => {
    const res = await apiClient.put<ApiResponse<AdminCoupon>>(`/admin/coupons/${id}`, payload);
    if (!res.data?.data) {
      throw new Error(res.data?.message || "Failed to update coupon");
    }
    return res.data.data;
  },

  adminToggleStatus: async (id: string, active: boolean): Promise<AdminCoupon> => {
    const res = await apiClient.patch<ApiResponse<AdminCoupon>>(`/admin/coupons/${id}/status`, null, {
      params: { active }
    });
    if (!res.data?.data) {
      throw new Error(res.data?.message || "Failed to update coupon status");
    }
    return res.data.data;
  },

  adminDelete: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/coupons/${id}`);
  }
};
