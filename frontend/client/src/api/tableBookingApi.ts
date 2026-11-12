import apiClient from "./client";
import { ApiResponse } from "../types/api/common";

export interface BookingStoreHeader {
  storeId: string;
  storeName: string;
  storeAddress: string;
  cuisines: string;
  coverImageUrl: string;
  contactPhone: string;
  latitude: number;
  longitude: number;
  cancellationPolicyText: string;
  isTableBookingEnabled: boolean;
}

export interface GuestConfig {
  minGuests: number;
  maxGuests: number;
  defaultGuests: number;
  availableGuestCounts: number[];
}

export interface BookingDateItem {
  key: string;
  dateFormatted: string;
  month: string;
  dayNum: string;
  dayName: string;
  discountBadge: string;
  isAvailable: boolean;
}

export interface BookingTimeSlotItem {
  time: string;
  discountBadge: string;
  status: "AVAILABLE" | "FILLING_FAST" | "SOLD_OUT";
  isAvailable: boolean;
}

export interface BookingOfferOptionItem {
  id: string;
  title: string;
  discountPct: number;
  coverChargePerGuest: number;
  isExclusive: boolean;
  isRegular?: boolean;
  perkHighlight?: string;
  minPartySize?: number;
  maxPartySize?: number;
  slotTimes?: string[];
  seatingAreas?: string[];
  termsAndConditions?: string;
}

export interface BookingVipPlanItem {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  subtitle: string;
  isDefaultAdded: boolean;
}

export interface TableBookingAvailabilityData {
  store: BookingStoreHeader;
  guestConfig: GuestConfig;
  upcomingDates: BookingDateItem[];
  lunchSlots: BookingTimeSlotItem[];
  dinnerSlots: BookingTimeSlotItem[];
  exclusiveOffers: BookingOfferOptionItem[];
  regularOffer: BookingOfferOptionItem;
  vipPlan: BookingVipPlanItem;
  paymentMethods: string[];
  termsAndConditions: string[];
  cancellationPolicy: {
    freeCancellationBeforeHours: number;
    refundPercentage: number;
    description: string;
  };
  seatingAreas?: string[];
}

export interface CreateTableBookingPayload {
  storeId: string;
  bookingDate: string;
  mealType: "LUNCH" | "DINNER";
  slotTime: string;
  guests: number;
  offerId?: string;
  offerTitle?: string;
  discountPct?: number;
  coverChargePerGuest?: number;
  includeVipPlan?: boolean;
  vipPlanFee?: number;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  paymentMethod?: string;
  specialRequests?: string;
}

export interface PayDiningBillPayload {
  customerId?: string;
  storeId?: string;
  storeName?: string;
  bookingRef?: string;
  bookingId?: string;
  billAmount: number;
  discountAmount: number;
  couponCode?: string;
  tipAmount?: number;
  coinsRedeemed?: number;
  coinsEarned?: number;
  totalPaid: number;
  paymentMethod: string;
  customerName?: string;
  customerPhone?: string;
}

export interface PayDiningBillResult {
  txnId: string;
  bookingRef?: string;
  storeId?: string;
  storeName: string;
  storeAddress: string;
  billAmount: number;
  discount: number;
  tip: number;
  totalPaid: number;
  coinsEarned: number;
  paymentMethod: string;
  status: string;
  timestamp: string;
  receiptNumber: string;
  message?: string;
}

export interface CancelTableBookingPayload {
  cancellationReason: string;
  comments?: string;
}

export interface TableBookingDetails {
  bookingId: string;
  bookingRef: string;
  storeId: string;
  storeName: string;
  storeAddress: string;
  coverImageUrl?: string;
  contactPhone?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  guests: number;
  bookingDate: string;
  formattedDate?: string;
  mealType: string;
  slotTime: string;
  offerTitle?: string;
  discountPct?: number;
  coverChargePerGuest?: number;
  totalCoverCharge?: number;
  includeVipPlan?: boolean;
  vipPlanFee?: number;
  totalPaid?: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status: "CONFIRMED" | "CANCELLED" | "SEATED" | "COMPLETED" | "NO_SHOW" | string;
  verificationCode?: string;
  qrCodeData?: string;
  cancellationDeadline?: string;
  canCancel?: boolean;
  isCancelled?: boolean;
  cancellationReason?: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundStatus?: string;
  refundRef?: string;
  coinsEarned?: number;
  diningInstructions?: string[];
  isCompleted?: boolean;
  diningPaymentStatus?: string;
  specialRequests?: string;
  createdAt?: string;
  billAmount?: number;
  billAddedAt?: string;
}

export const tableBookingApi = {
  /**
   * Fetch Table Booking Availability, Dates, Slots, and Pre-book Offers
   */
  getAvailability: async (
    storeId?: string,
    lat?: number,
    lng?: number
  ): Promise<TableBookingAvailabilityData> => {
    const params: Record<string, any> = {};
    if (storeId) {
      params.storeId = storeId;
      params.storeIdQuery = storeId;
    }
    if (lat != null) {
      params.lat = lat;
      params.latitude = lat;
    }
    if (lng != null) {
      params.lng = lng;
      params.longitude = lng;
    }

    const res = await apiClient.get<ApiResponse<TableBookingAvailabilityData>>(
      "/mobile/table-bookings/availability",
      { params }
    );
    return res.data?.data as TableBookingAvailabilityData;
  },

  /**
   * Create Table Booking / Pre-book Checkout Reservation
   */
  createBooking: async (
    payload: CreateTableBookingPayload
  ): Promise<TableBookingDetails> => {
    const res = await apiClient.post<ApiResponse<TableBookingDetails>>(
      "/mobile/table-bookings",
      payload
    );
    return res.data?.data as TableBookingDetails;
  },

  /**
   * Fetch Booking Details by internal ID or bookingRef
   */
  getBookingDetails: async (idOrRef: string): Promise<TableBookingDetails> => {
    const res = await apiClient.get<ApiResponse<TableBookingDetails>>(
      `/mobile/table-bookings/${encodeURIComponent(idOrRef)}`
    );
    return res.data?.data as TableBookingDetails;
  },

  /**
   * Cancel Table Booking & Process Automatic Refund
   */
  cancelBooking: async (
    idOrRef: string,
    payload: CancelTableBookingPayload
  ): Promise<TableBookingDetails> => {
    const res = await apiClient.post<ApiResponse<TableBookingDetails>>(
      `/mobile/table-bookings/${encodeURIComponent(idOrRef)}/cancel`,
      payload
    );
    return res.data?.data as TableBookingDetails;
  },

  /**
   * List Customer Reservations
   */
  getMyBookings: async (phone?: string): Promise<TableBookingDetails[]> => {
    const res = await apiClient.get<ApiResponse<TableBookingDetails[]>>(
      "/mobile/table-bookings",
      { params: phone ? { phone } : {} }
    );
    return (res.data?.data || []) as TableBookingDetails[];
  },

  /**
   * List all reservations for Admin, Merchant, or Store portals with filters
   */
  listBookings: async (params?: {
    storeId?: string;
    merchantId?: string;
    status?: string;
    date?: string;
    search?: string;
  }): Promise<TableBookingDetails[]> => {
    const res = await apiClient.get<ApiResponse<TableBookingDetails[]>>(
      "/mobile/table-bookings",
      { params }
    );
    return (res.data?.data || []) as TableBookingDetails[];
  },

  /**
   * Update reservation status (SEATED, COMPLETED, CANCELLED, NO_SHOW)
   */
  updateStatus: async (
    idOrRef: string,
    status: string,
    cancellationReason?: string,
    comments?: string
  ): Promise<TableBookingDetails> => {
    const res = await apiClient.patch<ApiResponse<TableBookingDetails>>(
      `/mobile/table-bookings/${encodeURIComponent(idOrRef)}/status`,
      { status, cancellationReason, comments }
    );
    return res.data?.data as TableBookingDetails;
  },

  /**
   * Attach/update final food bill amount on an active/seated table booking
   */
  setBillAmount: async (
    idOrRef: string,
    billAmount: number
  ): Promise<TableBookingDetails> => {
    const res = await apiClient.patch<ApiResponse<TableBookingDetails>>(
      `/mobile/table-bookings/${encodeURIComponent(idOrRef)}/bill-amount`,
      { billAmount }
    );
    return res.data?.data as TableBookingDetails;
  },

  /**
   * Process in-store dining bill payment via PINAK
   */
  payDiningBill: async (payload: PayDiningBillPayload): Promise<PayDiningBillResult> => {
    const res = await apiClient.post<ApiResponse<PayDiningBillResult>>(
      "/mobile/dining/pay-bill",
      payload
    );
    return res.data?.data as PayDiningBillResult;
  }
};

export default tableBookingApi;
