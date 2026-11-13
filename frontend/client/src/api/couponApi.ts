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
  }
};
