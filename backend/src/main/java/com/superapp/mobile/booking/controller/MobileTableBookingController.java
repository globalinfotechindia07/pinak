package com.superapp.mobile.booking.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.booking.dto.TableBookingDtos.*;
import com.superapp.mobile.booking.service.TableBookingService;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Tag(
        name = "Mobile App - Table Booking & Reservations (Screen 11 Next / Screen 12)",
        description = "Production APIs for customer restaurant table booking, slot availability, checkout, confirmation, and cancellations"
)
public class MobileTableBookingController {

    private final TableBookingService tableBookingService;
    private final StoreRepository storeRepository;
    private static final UUID DEFAULT_STORE_ID = UUID.fromString("97aabe53-9349-439d-952e-40f723bb8f51");

    public MobileTableBookingController(TableBookingService tableBookingService, StoreRepository storeRepository) {
        this.tableBookingService = tableBookingService;
        this.storeRepository = storeRepository;
    }

    @GetMapping({
            "/api/v1/mobile/table-bookings/availability",
            "//api/v1/mobile/table-bookings/availability",
            "/api/v1/mobile/stores/{storeId}/booking-availability",
            "//api/v1/mobile/stores/{storeId}/booking-availability"
    })
    @Operation(
            summary = "Fetch Table Booking Slot Availability & Pre-Book Offers",
            description = "Returns upcoming 7 calendar days, lunch/dinner time slots with discount labels, party size selector limits, active pre-book offers with redeemable cover charges, VIP membership upsell details, and terms & conditions."
    )
    public ResponseEntity<ApiResponse<TableBookingAvailabilityResponse>> getAvailability(
            @PathVariable(required = false) @Parameter(description = "Store Outlet UUID", example = "9fd49f6a-782e-447e-a2ec-db66fec40927") String storeId,
            @RequestParam(required = false) @Parameter(description = "Optional store ID query parameter", example = "9fd49f6a-782e-447e-a2ec-db66fec40927") String storeIdQuery,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude (short)", example = "21.1458") Double lat,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude", example = "21.1458") Double latitude,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude (short)", example = "79.0882") Double lng,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude", example = "79.0882") Double longitude
    ) {
        Double effectiveLat = lat != null ? lat : latitude;
        Double effectiveLng = lng != null ? lng : longitude;

        String effectiveStr = (storeId != null && !storeId.isBlank()) ? storeId : storeIdQuery;
        UUID effectiveId = parseStoreUuid(effectiveStr, effectiveLat, effectiveLng);

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(effectiveId, effectiveLat, effectiveLng);
        return ResponseEntity.ok(ApiResponse.success("Table booking availability fetched successfully", response));
    }

    @PostMapping({
            "/api/v1/mobile/table-bookings",
            "//api/v1/mobile/table-bookings"
    })
    @Operation(
            summary = "Create Table Booking / Pre-book Reservation",
            description = "Reserves a restaurant table for the chosen slot and guest party. Confirms cover charge settlement, creates unique booking reference (PNK-TB-XXXXXX), and returns instant booking confirmation."
    )
    public ResponseEntity<ApiResponse<TableBookingResponseDto>> createBooking(
            @Valid @RequestBody CreateTableBookingRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        TableBookingResponseDto response = tableBookingService.createBooking(request, authHeader);
        return ResponseEntity.ok(ApiResponse.success("Table reservation confirmed successfully", response));
    }

    @GetMapping({
            "/api/v1/mobile/table-bookings/{idOrRef}",
            "//api/v1/mobile/table-bookings/{idOrRef}"
    })
    @Operation(
            summary = "Fetch Table Reservation Details by ID or Booking Ref",
            description = "Returns full booking details including status, slot time, directions, host verification PIN, and cancellation eligibility."
    )
    public ResponseEntity<ApiResponse<TableBookingResponseDto>> getBookingDetails(
            @PathVariable @Parameter(description = "Booking ID (UUID) or Ref (e.g. PNK-TB-202611-123456)", example = "PNK-TB-202611-123456") String idOrRef
    ) {
        TableBookingResponseDto response = tableBookingService.getBookingDetails(idOrRef);
        return ResponseEntity.ok(ApiResponse.success("Table booking details fetched successfully", response));
    }

    @PostMapping({
            "/api/v1/mobile/table-bookings/{idOrRef}/cancel",
            "//api/v1/mobile/table-bookings/{idOrRef}/cancel"
    })
    @Operation(
            summary = "Cancel Table Reservation & Process Refund",
            description = "Cancels an active table booking. If cancelled before dining slot time, 100% of cover charge is automatically refunded to original payment method."
    )
    public ResponseEntity<ApiResponse<TableBookingResponseDto>> cancelBooking(
            @PathVariable @Parameter(description = "Booking ID (UUID) or Ref (e.g. PNK-TB-202611-123456)") String idOrRef,
            @Valid @RequestBody CancelTableBookingRequest cancelRequest
    ) {
        TableBookingResponseDto response = tableBookingService.cancelBooking(idOrRef, cancelRequest);
        return ResponseEntity.ok(ApiResponse.success("Table reservation cancelled successfully. Refund initiated.", response));
    }

    @PostMapping({
            "/api/v1/mobile/table-bookings/pay-bill",
            "//api/v1/mobile/table-bookings/pay-bill",
            "/api/v1/mobile/dining/pay-bill",
            "//api/v1/mobile/dining/pay-bill"
    })
    @Operation(
            summary = "Pay Dining Bill at Restaurant Table",
            description = "Processes customer dining bill settlement, links reservation if provided, generates verified platform transaction, and records merchant revenue."
    )
    public ResponseEntity<ApiResponse<PayDiningBillResponse>> payDiningBill(
            @Valid @RequestBody PayDiningBillRequest request,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        PayDiningBillResponse response = tableBookingService.payDiningBill(request, authHeader);
        return ResponseEntity.ok(ApiResponse.success("Dining bill paid successfully", response));
    }

    @GetMapping({
            "/api/v1/mobile/my-bookings",
            "//api/v1/mobile/my-bookings",
            "/api/v1/mobile/table-bookings/my",
            "//api/v1/mobile/table-bookings/my"
    })
    @Operation(
            summary = "List Customer Table Reservations",
            description = "Returns table bookings for the authenticated user or matching customer mobile number."
    )
    public ResponseEntity<ApiResponse<List<TableBookingResponseDto>>> getMyBookings(
            @RequestParam(required = false) @Parameter(description = "Customer phone number (e.g. +919876543210)", example = "+919876543210") String phone,
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        List<TableBookingResponseDto> response = tableBookingService.getUserBookings(phone, authHeader);
        return ResponseEntity.ok(ApiResponse.success("Table reservations retrieved successfully", response));
    }

    @GetMapping({
            "/api/v1/mobile/table-bookings",
            "//api/v1/mobile/table-bookings",
            "/api/v1/admin/table-bookings",
            "//api/v1/admin/table-bookings",
            "/api/v1/merchant/table-bookings",
            "//api/v1/merchant/table-bookings",
            "/api/v1/store/table-bookings",
            "//api/v1/store/table-bookings"
    })
    @Operation(
            summary = "List Table Bookings for Admin, Merchant, and Store portals",
            description = "Returns table reservations with filters for store, merchant, status, date, or search query"
    )
    public ResponseEntity<ApiResponse<List<TableBookingResponseDto>>> listBookings(
            @RequestParam(required = false) String storeId,
            @RequestParam(required = false) String merchantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String search
    ) {
        UUID sId = null;
        if (storeId != null && !storeId.isBlank() && !"ALL".equalsIgnoreCase(storeId) && !"undefined".equalsIgnoreCase(storeId) && !"null".equalsIgnoreCase(storeId)) {
            try {
                sId = UUID.fromString(storeId.trim());
            } catch (Exception ignored) {}
        }
        UUID mId = null;
        if (merchantId != null && !merchantId.isBlank() && !"ALL".equalsIgnoreCase(merchantId) && !"undefined".equalsIgnoreCase(merchantId) && !"null".equalsIgnoreCase(merchantId)) {
            try {
                mId = UUID.fromString(merchantId.trim());
            } catch (Exception ignored) {}
        }

        List<TableBookingResponseDto> list = tableBookingService.listBookings(sId, mId, status, date, search);
        return ResponseEntity.ok(ApiResponse.success("Table bookings retrieved successfully", list));
    }

    @PatchMapping({
            "/api/v1/mobile/table-bookings/{idOrRef}/status",
            "//api/v1/mobile/table-bookings/{idOrRef}/status",
            "/api/v1/admin/table-bookings/{idOrRef}/status",
            "//api/v1/admin/table-bookings/{idOrRef}/status",
            "/api/v1/merchant/table-bookings/{idOrRef}/status",
            "//api/v1/merchant/table-bookings/{idOrRef}/status",
            "/api/v1/store/table-bookings/{idOrRef}/status",
            "//api/v1/store/table-bookings/{idOrRef}/status"
    })
    @Operation(
            summary = "Update Table Booking Status (SEATED, COMPLETED, CANCELLED, NO_SHOW)",
            description = "Updates reservation status from store host, merchant console, or super admin dashboard"
    )
    public ResponseEntity<ApiResponse<TableBookingResponseDto>> updateBookingStatus(
            @PathVariable String idOrRef,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) UpdateTableBookingStatusRequest request
    ) {
        String effectiveStatus = (request != null && request.status() != null && !request.status().isBlank())
                ? request.status()
                : status;
        String reason = request != null ? request.cancellationReason() : null;
        String comments = request != null ? request.comments() : null;

        TableBookingResponseDto updated = tableBookingService.updateBookingStatus(idOrRef, effectiveStatus, reason, comments);
        if (request != null && request.billAmount() != null && request.billAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            updated = tableBookingService.setBillAmount(idOrRef, request.billAmount());
        }
        return ResponseEntity.ok(ApiResponse.success("Booking status updated successfully", updated));
    }

    @PatchMapping({
            "/api/v1/mobile/table-bookings/{idOrRef}/bill-amount",
            "//api/v1/mobile/table-bookings/{idOrRef}/bill-amount",
            "/api/v1/admin/table-bookings/{idOrRef}/bill-amount",
            "//api/v1/admin/table-bookings/{idOrRef}/bill-amount",
            "/api/v1/merchant/table-bookings/{idOrRef}/bill-amount",
            "//api/v1/merchant/table-bookings/{idOrRef}/bill-amount",
            "/api/v1/store/table-bookings/{idOrRef}/bill-amount",
            "//api/v1/store/table-bookings/{idOrRef}/bill-amount"
    })
    @Operation(
            summary = "Attach Food Bill Amount to Table Reservation",
            description = "Allows store staff or merchant manager to set the final food bill amount on an active/seated table booking."
    )
    public ResponseEntity<ApiResponse<TableBookingResponseDto>> setBillAmount(
            @PathVariable String idOrRef,
            @Valid @RequestBody SetBillAmountRequest request
    ) {
        TableBookingResponseDto updated = tableBookingService.setBillAmount(idOrRef, request.billAmount());
        return ResponseEntity.ok(ApiResponse.success("Food bill amount attached successfully to reservation", updated));
    }

    private UUID parseStoreUuid(String storeIdStr, Double effectiveLat, Double effectiveLng) {
        if (storeIdStr != null && !storeIdStr.isBlank()
                && !"undefined".equalsIgnoreCase(storeIdStr)
                && !"null".equalsIgnoreCase(storeIdStr)
                && !"availability".equalsIgnoreCase(storeIdStr)) {
            try {
                return UUID.fromString(storeIdStr.trim());
            } catch (IllegalArgumentException ignored) {}
        }
        if (effectiveLat != null && effectiveLng != null) {
            Page<Store> nearby = storeRepository.findNearbyApprovedStores(effectiveLat, effectiveLng, 50000.0, PageRequest.of(0, 1));
            if (!nearby.isEmpty()) {
                return nearby.getContent().get(0).getId();
            }
        }
        List<Store> any = storeRepository.findAll();
        if (!any.isEmpty()) {
            return any.get(0).getId();
        }
        return DEFAULT_STORE_ID;
    }
}
