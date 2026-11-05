package com.superapp.mobile.booking.service;

import com.superapp.mobile.booking.dto.TableBookingDtos.*;

import java.util.List;
import java.util.UUID;

public interface TableBookingService {

    /**
     * Fetches dynamic slot schedule, guest options, offers, and store details for the Table Booking screen.
     */
    TableBookingAvailabilityResponse getBookingAvailability(UUID storeId, Double lat, Double lng);

    /**
     * Confirms and persists a table reservation with pre-book cover charge and optional VIP membership.
     */
    TableBookingResponseDto createBooking(CreateTableBookingRequest request, String authHeader);

    /**
     * Retrieves table reservation details by internal UUID or human-readable booking reference.
     */
    TableBookingResponseDto getBookingDetails(String idOrRef);

    /**
     * Cancels an active table booking, updates status, and initiates 100% cover charge refund.
     */
    TableBookingResponseDto cancelBooking(String idOrRef, CancelTableBookingRequest cancelRequest);

    /**
     * Lists reservations for a user or phone number.
     */
    List<TableBookingResponseDto> getUserBookings(String customerPhone, String authHeader);

    /**
     * Lists bookings for admin, merchant, or store with optional filters.
     */
    List<TableBookingResponseDto> listBookings(UUID storeId, UUID merchantId, String status, String dateKey, String search);

    /**
     * Updates reservation status (e.g. SEATED, COMPLETED, CANCELLED, NO_SHOW).
     */
    TableBookingResponseDto updateBookingStatus(String idOrRef, String newStatus, String cancellationReason, String comments);

    /**
     * Attaches or updates the final food bill amount on an active/seated table booking.
     */
    TableBookingResponseDto setBillAmount(String idOrRef, java.math.BigDecimal billAmount);

    /**
     * Processes in-restaurant dining bill settlement, generates ledger transaction,
     * links/completes reservation if present, and returns confirmed payment details.
     */
    PayDiningBillResponse payDiningBill(PayDiningBillRequest request, String authHeader);
}
