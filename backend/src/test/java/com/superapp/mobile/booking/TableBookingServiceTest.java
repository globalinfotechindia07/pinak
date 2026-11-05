package com.superapp.mobile.booking;

import com.superapp.common.security.JwtService;
import com.superapp.mobile.booking.dto.TableBookingDtos.*;
import com.superapp.mobile.booking.entity.TableBooking;
import com.superapp.mobile.booking.repository.TableBookingRepository;
import com.superapp.mobile.booking.service.TableBookingServiceImpl;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TableBookingServiceTest {

    @Mock
    private TableBookingRepository tableBookingRepository;

    @Mock
    private StoreRepository storeRepository;

    @Mock
    private OfferRepository offerRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private TableBookingServiceImpl tableBookingService;

    private Store sampleStore;
    private UUID storeId;

    @BeforeEach
    void setUp() {
        storeId = UUID.randomUUID();
        sampleStore = new Store();
        sampleStore.setId(storeId);
        sampleStore.setStoreName("Haldiram's Sweets & Snacks - Nagpur Flagship");
        sampleStore.setAddress("West High Court Road, Dharampeth");
        sampleStore.setCuisineOrCategory("North Indian, Sweets & Snacks");
        sampleStore.setPhone("+919145776684");
    }

    @Test
    void testGetBookingAvailability_Success() {
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));
        when(offerRepository.findActiveOffersByStoreOrMerchant(eq(storeId), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(storeId, 21.1458, 79.0882);

        assertNotNull(response);
        assertEquals("Haldiram's Sweets & Snacks - Nagpur Flagship", response.store().storeName());
        assertEquals(7, response.upcomingDates().size());
        assertEquals("Today", response.upcomingDates().get(0).dayName());
        assertFalse(response.lunchSlots().isEmpty());
        assertFalse(response.dinnerSlots().isEmpty());
        assertFalse(response.exclusiveOffers().isEmpty());
        assertNotNull(response.regularOffer());
        assertNotNull(response.vipPlan());
        assertEquals(new BigDecimal("1.00"), response.vipPlan().price());
    }

    @Test
    void testGetBookingAvailability_StoreDisabledTableBooking() {
        sampleStore.setIsTableBookingEnabled(false);
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(storeId, 21.1458, 79.0882);

        assertNotNull(response);
        assertFalse(response.store().isTableBookingEnabled());
        assertNull(response.regularOffer());
        assertTrue(response.lunchSlots().isEmpty());
        assertTrue(response.dinnerSlots().isEmpty());
    }

    @Test
    void testGetBookingAvailability_CustomStandardCoverCharge() {
        sampleStore.setIsTableBookingEnabled(true);
        sampleStore.setAllowFreeStandardBooking(false);
        sampleStore.setDefaultStandardCoverCharge(new BigDecimal("50.00"));

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));
        when(offerRepository.findActiveOffersByStoreOrMerchant(eq(storeId), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(Collections.emptyList()));

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(storeId, 21.1458, 79.0882);

        assertNotNull(response);
        assertTrue(response.store().isTableBookingEnabled());
        assertNotNull(response.regularOffer());
        assertEquals(new BigDecimal("50.00"), response.regularOffer().coverChargePerGuest());
    }

    @Test
    void testGetBookingAvailability_WithConfiguredLunchSlot_HasEmptyDinnerSlots() {
        sampleStore.setIsTableBookingEnabled(true);
        com.superapp.offer.entity.Offer lunchOnlyOffer = new com.superapp.offer.entity.Offer();
        lunchOnlyOffer.setId(UUID.randomUUID());
        lunchOnlyOffer.setStoreId(storeId);
        lunchOnlyOffer.setTitle("Lunch Special 50% OFF");
        lunchOnlyOffer.setIsTableBookingEnabled(true);
        lunchOnlyOffer.setValue(new BigDecimal("50.00"));
        lunchOnlyOffer.setSlotTimes("[\"12:00 PM\"]");

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));
        when(offerRepository.findActiveOffersByStoreOrMerchant(eq(storeId), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(java.util.List.of(lunchOnlyOffer)));

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(storeId, 21.1458, 79.0882);

        assertNotNull(response);
        assertEquals(1, response.lunchSlots().size());
        assertEquals("12:00 PM", response.lunchSlots().get(0).time());
        assertTrue(response.dinnerSlots().isEmpty(), "Dinner slots must be empty when merchant configured only lunch slots");
    }

    @Test
    void testCreateBooking_Success() {
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));
        when(tableBookingRepository.save(any(TableBooking.class))).thenAnswer(invocation -> {
            TableBooking tb = invocation.getArgument(0);
            tb.setId(UUID.randomUUID());
            return tb;
        });

        CreateTableBookingRequest request = new CreateTableBookingRequest(
                storeId,
                LocalDate.now().toString(),
                "LUNCH",
                "01:45 PM",
                2,
                "opt_primary",
                "Flat 20% off on Total Bill",
                new BigDecimal("20.00"),
                new BigDecimal("25.00"),
                true,
                new BigDecimal("1.00"),
                "Rohan Sharma",
                "+919876543210",
                "rohan@example.com",
                "Google Pay",
                "Window table please"
        );

        TableBookingResponseDto response = tableBookingService.createBooking(request, null);

        assertNotNull(response);
        assertTrue(response.bookingRef().startsWith("PNK-TB-"));
        assertEquals("CONFIRMED", response.status());
        assertEquals(2, response.guests());
        assertEquals(new BigDecimal("50.00"), response.totalCoverCharge());
        assertEquals(new BigDecimal("1.00"), response.vipPlanFee());
        assertEquals(new BigDecimal("51.00"), response.totalPaid());
        assertNotNull(response.verificationCode());
        assertEquals(4, response.verificationCode().length());
        assertTrue(response.canCancel());
        assertFalse(response.isCancelled());
    }

    @Test
    void testCancelBooking_Success() {
        TableBooking existing = new TableBooking();
        existing.setId(UUID.randomUUID());
        existing.setBookingRef("PNK-TB-202611-123456");
        existing.setStoreId(storeId);
        existing.setCustomerName("Rohan");
        existing.setCustomerPhone("+919876543210");
        existing.setGuests(2);
        existing.setBookingDate(LocalDate.now());
        existing.setTotalCoverCharge(new BigDecimal("50.00"));
        existing.setTotalPaid(new BigDecimal("51.00"));
        existing.setStatus("CONFIRMED");

        when(tableBookingRepository.findByBookingRef("PNK-TB-202611-123456")).thenReturn(Optional.of(existing));
        when(tableBookingRepository.save(any(TableBooking.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));

        CancelTableBookingRequest cancelRequest = new CancelTableBookingRequest(
                "Change of plans",
                "Cannot make it for lunch"
        );

        TableBookingResponseDto response = tableBookingService.cancelBooking("PNK-TB-202611-123456", cancelRequest);

        assertNotNull(response);
        assertEquals("CANCELLED", response.status());
        assertTrue(response.isCancelled());
        assertFalse(response.canCancel());
        assertEquals(new BigDecimal("50.00"), response.refundAmount());
        assertEquals("INITIATED", response.refundStatus());
        assertTrue(response.refundRef().startsWith("REF-PNK-"));
    }

    @Test
    void testGetBookingAvailability_WithOfferSlotsAndPartySize_SortedChronologically() {
        com.superapp.offer.entity.Offer offer = new com.superapp.offer.entity.Offer();
        offer.setId(UUID.randomUUID());
        offer.setTitle("Weekend Table Feast: 50% OFF on Advance Booking");
        offer.setValue(new BigDecimal("50.00"));
        offer.setType(com.superapp.offer.enums.OfferType.PERCENTAGE_DISCOUNT);
        offer.setMinPartySize(2);
        offer.setMaxPartySize(6);
        offer.setCoverChargeAmount(BigDecimal.ZERO);
        offer.setIsTableBookingEnabled(true);
        offer.setSlotTimes("[\"12:30 PM\",\"01:00 PM\",\"01:30 PM\",\"07:00 PM\",\"07:30 PM\",\"08:00 PM\",\"08:30 PM\",\"09:30 PM\",\"09:00 PM\",\"10:00 PM\",\"02:00 PM\",\"12:00 PM\"]");
        offer.setSeatingAreas("[\"Indoor AC Dining\",\"Outdoor / Rooftop\"]");

        when(storeRepository.findById(storeId)).thenReturn(Optional.of(sampleStore));
        when(offerRepository.findActiveOffersByStoreOrMerchant(eq(storeId), any(), any(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(java.util.List.of(offer)));

        TableBookingAvailabilityResponse response = tableBookingService.getBookingAvailability(storeId, 21.1458, 79.0882);

        assertNotNull(response);
        assertEquals(2, response.guestConfig().minGuests());
        assertEquals(6, response.guestConfig().maxGuests());
        assertEquals(java.util.List.of(2, 3, 4, 5, 6), response.guestConfig().availableGuestCounts());
        assertEquals("50% off", response.upcomingDates().get(0).discountBadge());

        // Verify Lunch slots strictly sorted chronologically: 12:00 PM, 12:30 PM, 01:00 PM, 01:30 PM, 02:00 PM
        assertEquals(5, response.lunchSlots().size());
        assertEquals("12:00 PM", response.lunchSlots().get(0).time());
        assertEquals("12:30 PM", response.lunchSlots().get(1).time());
        assertEquals("01:00 PM", response.lunchSlots().get(2).time());
        assertEquals("01:30 PM", response.lunchSlots().get(3).time());
        assertEquals("02:00 PM", response.lunchSlots().get(4).time());
        assertEquals("50% off", response.lunchSlots().get(0).discountBadge());

        // Verify Dinner slots strictly sorted chronologically: 07:00 PM to 10:00 PM with 09:00 PM before 09:30 PM
        assertEquals(7, response.dinnerSlots().size());
        assertEquals("07:00 PM", response.dinnerSlots().get(0).time());
        assertEquals("07:30 PM", response.dinnerSlots().get(1).time());
        assertEquals("08:00 PM", response.dinnerSlots().get(2).time());
        assertEquals("08:30 PM", response.dinnerSlots().get(3).time());
        assertEquals("09:00 PM", response.dinnerSlots().get(4).time());
        assertEquals("09:30 PM", response.dinnerSlots().get(5).time());
        assertEquals("10:00 PM", response.dinnerSlots().get(6).time());
        assertEquals("50% off", response.dinnerSlots().get(4).discountBadge());

        // Verify Seating areas returned
        assertNotNull(response.seatingAreas());
        assertEquals(java.util.List.of("Indoor AC Dining", "Outdoor / Rooftop"), response.seatingAreas());
    }
}
