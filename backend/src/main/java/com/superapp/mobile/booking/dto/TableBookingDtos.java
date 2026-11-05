package com.superapp.mobile.booking.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Consolidated DTOs for Table Booking & Pre-Booking Flows (Screen 11 Next Screen / Screen 12).
 */
public final class TableBookingDtos {

    private TableBookingDtos() {}

    @Schema(description = "Store overview header in table booking screen")
    public record BookingStoreHeaderDto(
            UUID storeId,
            String storeName,
            String storeAddress,
            String cuisines,
            String coverImageUrl,
            String contactPhone,
            Double latitude,
            Double longitude,
            String cancellationPolicyText,
            boolean isTableBookingEnabled
    ) {}

    @Schema(description = "Guest party size limits and presets")
    public record GuestConfigDto(
            int minGuests,
            int maxGuests,
            int defaultGuests,
            List<Integer> availableGuestCounts
    ) {}

    @Schema(description = "Upcoming booking date day pill")
    public record BookingDateDto(
            String key, // "2026-11-02"
            String dateFormatted, // "02 Nov 2026"
            String month, // "Nov"
            String dayNum, // "02"
            String dayName, // "Today", "Tomorrow", "Wed"
            String discountBadge, // "20% off"
            boolean isAvailable
    ) {}

    @Schema(description = "Time slot item for lunch or dinner")
    public record BookingTimeSlotDto(
            String time, // "01:45 PM"
            String discountBadge, // "20% off"
            String status, // "AVAILABLE", "FILLING_FAST", "SOLD_OUT"
            boolean isAvailable
    ) {}

    @Schema(description = "Pre-book offer or regular table reservation option")
    public record BookingOfferOptionDto(
            String id,
            String title,
            BigDecimal discountPct,
            BigDecimal coverChargePerGuest,
            boolean isExclusive,
            boolean isRegular,
            String perkHighlight,
            Integer minPartySize,
            Integer maxPartySize,
            List<String> slotTimes,
            List<String> seatingAreas,
            String termsAndConditions
    ) {
        public BookingOfferOptionDto(
                String id,
                String title,
                BigDecimal discountPct,
                BigDecimal coverChargePerGuest,
                boolean isExclusive,
                boolean isRegular,
                String perkHighlight
        ) {
            this(id, title, discountPct, coverChargePerGuest, isExclusive, isRegular, perkHighlight, null, null, null, null, null);
        }
    }

    @Schema(description = "Auto-added VIP membership upsell details")
    public record BookingVipPlanDto(
            String id,
            String title,
            BigDecimal price,
            BigDecimal originalPrice,
            String subtitle,
            boolean isDefaultAdded
    ) {}

    @Schema(description = "Cancellation policy terms")
    public record BookingCancellationPolicyDto(
            int freeCancellationBeforeHours,
            int refundPercentage,
            String description
    ) {}

    @Schema(description = "Full availability configuration payload returned to initialize the Table Booking Screen")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record TableBookingAvailabilityResponse(
            BookingStoreHeaderDto store,
            GuestConfigDto guestConfig,
            List<BookingDateDto> upcomingDates,
            List<BookingTimeSlotDto> lunchSlots,
            List<BookingTimeSlotDto> dinnerSlots,
            List<BookingOfferOptionDto> exclusiveOffers,
            BookingOfferOptionDto regularOffer,
            BookingVipPlanDto vipPlan,
            List<String> paymentMethods,
            List<String> termsAndConditions,
            BookingCancellationPolicyDto cancellationPolicy,
            List<String> seatingAreas
    ) {
        public TableBookingAvailabilityResponse(
                BookingStoreHeaderDto store,
                GuestConfigDto guestConfig,
                List<BookingDateDto> upcomingDates,
                List<BookingTimeSlotDto> lunchSlots,
                List<BookingTimeSlotDto> dinnerSlots,
                List<BookingOfferOptionDto> exclusiveOffers,
                BookingOfferOptionDto regularOffer,
                BookingVipPlanDto vipPlan,
                List<String> paymentMethods,
                List<String> termsAndConditions,
                BookingCancellationPolicyDto cancellationPolicy
        ) {
            this(store, guestConfig, upcomingDates, lunchSlots, dinnerSlots, exclusiveOffers, regularOffer, vipPlan, paymentMethods, termsAndConditions, cancellationPolicy, null);
        }
    }

    @Schema(description = "Payload to confirm a table reservation checkout")
    public record CreateTableBookingRequest(
            @NotNull(message = "storeId is required")
            UUID storeId,

            @NotBlank(message = "bookingDate is required (YYYY-MM-DD)")
            String bookingDate,

            @NotBlank(message = "mealType is required (LUNCH or DINNER)")
            String mealType,

            @NotBlank(message = "slotTime is required (e.g. 01:45 PM)")
            String slotTime,

            @NotNull(message = "guests count is required")
            @Min(value = 1, message = "Minimum party size is 1")
            Integer guests,

            String offerId,
            String offerTitle,
            BigDecimal discountPct,
            BigDecimal coverChargePerGuest,
            Boolean includeVipPlan,
            BigDecimal vipPlanFee,

            @NotBlank(message = "customerName is required")
            String customerName,

            @NotBlank(message = "customerPhone is required")
            String customerPhone,

            String customerEmail,
            String paymentMethod,
            String specialRequests
    ) {}

    @Schema(description = "Payload to cancel an existing table booking")
    public record CancelTableBookingRequest(
            @NotBlank(message = "cancellationReason is required")
            String cancellationReason,

            String comments
    ) {}

    @Schema(description = "Payload to update table booking status from admin / merchant / store console")
    public record UpdateTableBookingStatusRequest(
            @NotBlank(message = "status is required")
            String status,

            BigDecimal billAmount,

            String cancellationReason,

            String comments
    ) {
        public UpdateTableBookingStatusRequest(String status, String cancellationReason, String comments) {
            this(status, null, cancellationReason, comments);
        }
    }

    @Schema(description = "Payload for store to attach/update food bill amount on an active table booking")
    public record SetBillAmountRequest(
            @NotNull(message = "billAmount is required")
            @Min(value = 1, message = "Bill amount must be greater than zero")
            BigDecimal billAmount
    ) {}

    @Schema(description = "Full table booking reservation details response")
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public record TableBookingResponseDto(
            UUID bookingId,
            String bookingRef,
            UUID storeId,
            String storeName,
            String storeAddress,
            String coverImageUrl,
            String contactPhone,
            String customerName,
            String customerPhone,
            String customerEmail,
            Integer guests,
            String bookingDate,
            String formattedDate,
            String mealType,
            String slotTime,
            String offerTitle,
            BigDecimal discountPct,
            BigDecimal coverChargePerGuest,
            BigDecimal totalCoverCharge,
            Boolean includeVipPlan,
            BigDecimal vipPlanFee,
            BigDecimal totalPaid,
            String paymentMethod,
            String paymentStatus,
            String status,
            String verificationCode,
            String qrCodeData,
            Instant cancellationDeadline,
            boolean canCancel,
            boolean isCancelled,
            String cancellationReason,
            Instant cancelledAt,
            BigDecimal refundAmount,
            String refundStatus,
            String refundRef,
            Integer coinsEarned,
            List<String> diningInstructions,
            String specialRequests,
            Instant createdAt,
            BigDecimal billAmount,
            Instant billAddedAt
    ) {
        public TableBookingResponseDto(
                UUID bookingId, String bookingRef, UUID storeId, String storeName, String storeAddress,
                String coverImageUrl, String contactPhone, String customerName, String customerPhone,
                String customerEmail, Integer guests, String bookingDate, String formattedDate,
                String mealType, String slotTime, String offerTitle, BigDecimal discountPct,
                BigDecimal coverChargePerGuest, BigDecimal totalCoverCharge, Boolean includeVipPlan,
                BigDecimal vipPlanFee, BigDecimal totalPaid, String paymentMethod, String paymentStatus,
                String status, String verificationCode, String qrCodeData, Instant cancellationDeadline,
                boolean canCancel, boolean isCancelled, String cancellationReason, Instant cancelledAt,
                BigDecimal refundAmount, String refundStatus, String refundRef, Integer coinsEarned,
                List<String> diningInstructions, String specialRequests, Instant createdAt
        ) {
            this(bookingId, bookingRef, storeId, storeName, storeAddress, coverImageUrl, contactPhone,
                 customerName, customerPhone, customerEmail, guests, bookingDate, formattedDate,
                 mealType, slotTime, offerTitle, discountPct, coverChargePerGuest, totalCoverCharge,
                 includeVipPlan, vipPlanFee, totalPaid, paymentMethod, paymentStatus, status,
                 verificationCode, qrCodeData, cancellationDeadline, canCancel, isCancelled,
                 cancellationReason, cancelledAt, refundAmount, refundStatus, refundRef, coinsEarned,
                 diningInstructions, specialRequests, createdAt, null, null);
        }
    }

    @Schema(description = "Dining bill payment request payload from customer PayBillView")
    public record PayDiningBillRequest(
            String storeId,
            String storeName,
            String bookingRef,
            String bookingId,
            BigDecimal billAmount,
            BigDecimal discountAmount,
            String couponCode,
            BigDecimal tipAmount,
            Integer coinsRedeemed,
            Integer coinsEarned,
            BigDecimal totalPaid,
            String paymentMethod,
            String customerName,
            String customerPhone
    ) {}

    @Schema(description = "Dining bill payment confirmation returned to mobile client")
    public record PayDiningBillResponse(
            String txnId,
            String bookingRef,
            UUID storeId,
            String storeName,
            String storeAddress,
            BigDecimal billAmount,
            BigDecimal discount,
            BigDecimal tip,
            BigDecimal totalPaid,
            Integer coinsEarned,
            String paymentMethod,
            String status,
            String timestamp,
            String receiptNumber,
            String message
    ) {}
}
