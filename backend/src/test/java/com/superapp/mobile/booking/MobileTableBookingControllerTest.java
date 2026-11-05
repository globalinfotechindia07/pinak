package com.superapp.mobile.booking;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.mobile.booking.controller.MobileTableBookingController;
import com.superapp.mobile.booking.dto.TableBookingDtos.*;
import com.superapp.mobile.booking.service.TableBookingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class MobileTableBookingControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TableBookingService tableBookingService;

    @InjectMocks
    private MobileTableBookingController controller;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private UUID storeId;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        storeId = UUID.fromString("97aabe53-9349-439d-952e-40f723bb8f51");
    }

    @Test
    void testGetAvailability_Returns200() throws Exception {
        TableBookingAvailabilityResponse mockResponse = new TableBookingAvailabilityResponse(
                new BookingStoreHeaderDto(
                        storeId,
                        "Haldiram's Sweets & Snacks",
                        "Nagpur",
                        "North Indian",
                        "https://example.com/cover.jpg",
                        "+919876543210",
                        21.1458,
                        79.0882,
                        "Free cancellation",
                        true
                ),
                new GuestConfigDto(1, 8, 2, List.of(1, 2, 3, 4, 5, 6, 7, 8)),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                Collections.emptyList(),
                new BookingOfferOptionDto("opt_regular", "Standard table booking", BigDecimal.ZERO, BigDecimal.ZERO, false, true, "Free"),
                new BookingVipPlanDto("vip_1m", "VIP 1 Month", BigDecimal.ONE, new BigDecimal("99.00"), "Sub", true),
                List.of("Google Pay"),
                List.of("Terms apply"),
                new BookingCancellationPolicyDto(0, 100, "Free cancellation")
        );

        when(tableBookingService.getBookingAvailability(any(), any(), any())).thenReturn(mockResponse);

        mockMvc.perform(get("/api/v1/mobile/table-bookings/availability")
                        .param("storeIdQuery", storeId.toString())
                        .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.store.storeName").value("Haldiram's Sweets & Snacks"));
    }

    @Test
    void testCreateBooking_Returns200() throws Exception {
        CreateTableBookingRequest request = new CreateTableBookingRequest(
                storeId,
                LocalDate.now().toString(),
                "LUNCH",
                "01:45 PM",
                2,
                "opt_primary",
                "Flat 20% off",
                new BigDecimal("20.00"),
                new BigDecimal("25.00"),
                true,
                BigDecimal.ONE,
                "Rohan Sharma",
                "+919876543210",
                "rohan@example.com",
                "Google Pay",
                "Near window"
        );

        TableBookingResponseDto mockResponse = new TableBookingResponseDto(
                UUID.randomUUID(),
                "PNK-TB-202611-999888",
                storeId,
                "Haldiram's Sweets & Snacks",
                "Nagpur",
                "https://example.com/cover.jpg",
                "+919876543210",
                "Rohan Sharma",
                "+919876543210",
                "rohan@example.com",
                2,
                LocalDate.now().toString(),
                "02 Nov 2026",
                "LUNCH",
                "01:45 PM",
                "Flat 20% off",
                new BigDecimal("20.00"),
                new BigDecimal("25.00"),
                new BigDecimal("50.00"),
                true,
                BigDecimal.ONE,
                new BigDecimal("51.00"),
                "Google Pay",
                "PAID",
                "CONFIRMED",
                "4821",
                "{}",
                Instant.now().plusSeconds(3600),
                true,
                false,
                null,
                null,
                BigDecimal.ZERO,
                null,
                null,
                60,
                List.of("Instruction 1"),
                "Near window",
                Instant.now()
        );

        when(tableBookingService.createBooking(any(), any())).thenReturn(mockResponse);

        mockMvc.perform(post("/api/v1/mobile/table-bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.bookingRef").value("PNK-TB-202611-999888"))
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.totalPaid").value(51.00));
    }

    @Test
    void testCancelBooking_Returns200() throws Exception {
        CancelTableBookingRequest cancelRequest = new CancelTableBookingRequest("Change of plans", "Cannot visit");

        TableBookingResponseDto cancelledResponse = new TableBookingResponseDto(
                UUID.randomUUID(),
                "PNK-TB-202611-999888",
                storeId,
                "Haldiram's Sweets & Snacks",
                "Nagpur",
                "https://example.com/cover.jpg",
                "+919876543210",
                "Rohan Sharma",
                "+919876543210",
                "rohan@example.com",
                2,
                LocalDate.now().toString(),
                "02 Nov 2026",
                "LUNCH",
                "01:45 PM",
                "Flat 20% off",
                new BigDecimal("20.00"),
                new BigDecimal("25.00"),
                new BigDecimal("50.00"),
                true,
                BigDecimal.ONE,
                new BigDecimal("51.00"),
                "Google Pay",
                "PAID",
                "CANCELLED",
                "4821",
                "{}",
                Instant.now(),
                false,
                true,
                "Change of plans",
                Instant.now(),
                new BigDecimal("50.00"),
                "INITIATED",
                "REF-PNK-A1B2C3D4",
                0,
                List.of(),
                null,
                Instant.now()
        );

        when(tableBookingService.cancelBooking(eq("PNK-TB-202611-999888"), any())).thenReturn(cancelledResponse);

        mockMvc.perform(post("/api/v1/mobile/table-bookings/PNK-TB-202611-999888/cancel")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(cancelRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.isCancelled").value(true))
                .andExpect(jsonPath("$.data.refundAmount").value(50.00))
                .andExpect(jsonPath("$.data.refundRef").value("REF-PNK-A1B2C3D4"));
    }
}
