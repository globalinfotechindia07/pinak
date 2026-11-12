package com.superapp.mobile.booking.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.common.exception.AppException;
import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.common.security.JwtService;
import com.superapp.mobile.booking.dto.TableBookingDtos.*;
import com.superapp.mobile.booking.entity.TableBooking;
import com.superapp.mobile.booking.repository.TableBookingRepository;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.repository.OfferRepository;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import com.superapp.transaction.transaction.entity.Transaction;
import com.superapp.transaction.transaction.enums.TransactionStatus;
import com.superapp.transaction.transaction.enums.TransactionType;
import com.superapp.transaction.transaction.repository.TransactionRepository;
import com.superapp.transaction.reward.service.RewardService;
import com.superapp.user.entity.Role;
import com.superapp.user.entity.User;
import com.superapp.user.entity.UserStatus;
import com.superapp.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class TableBookingServiceImpl implements TableBookingService {

    private static final Logger log = LoggerFactory.getLogger(TableBookingServiceImpl.class);

    private static final DateTimeFormatter DATE_KEY_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
    private static final DateTimeFormatter DISPLAY_DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    private final TableBookingRepository tableBookingRepository;
    private final StoreRepository storeRepository;
    private final OfferRepository offerRepository;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final TransactionRepository transactionRepository;
    private final RewardService rewardService;
    private final SecureRandom random = new SecureRandom();

    public TableBookingServiceImpl(
            TableBookingRepository tableBookingRepository,
            StoreRepository storeRepository,
            OfferRepository offerRepository,
            UserRepository userRepository,
            JwtService jwtService,
            TransactionRepository transactionRepository,
            @org.springframework.beans.factory.annotation.Autowired(required = false) RewardService rewardService
    ) {
        this.tableBookingRepository = tableBookingRepository;
        this.storeRepository = storeRepository;
        this.offerRepository = offerRepository;
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.transactionRepository = transactionRepository;
        this.rewardService = rewardService;
    }

    @Override
    @Transactional(readOnly = true)
    public TableBookingAvailabilityResponse getBookingAvailability(UUID storeId, Double lat, Double lng) {
        Store store = resolveStore(storeId);

        // 1. Build Store Overview Header
        String coverImage = store.getImageUrl() != null && !store.getImageUrl().isBlank()
                ? store.getImageUrl()
                : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80";
        String contactPhone = store.getPhone() != null && !store.getPhone().isBlank()
                ? store.getPhone()
                : "+919880011234";
        String cuisines = store.getCuisineOrCategory() != null && !store.getCuisineOrCategory().isBlank()
                ? store.getCuisineOrCategory()
                : "North Indian, Sweets & Snacks";

        BigDecimal cashbackPct = store.getCashbackPercentage() != null ? store.getCashbackPercentage() : new BigDecimal("5.00");
        BigDecimal maxCashback = store.getMaxCashbackAmount() != null ? store.getMaxCashbackAmount() : new BigDecimal("150.00");
        BigDecimal minSpend = store.getMinTransactionForCashback() != null ? store.getMinTransactionForCashback() : new BigDecimal("100.00");
        boolean isCashbackActive = store.getIsCashbackEnabled() == null || Boolean.TRUE.equals(store.getIsCashbackEnabled());

        BookingStoreHeaderDto storeHeader = new BookingStoreHeaderDto(
                store.getId(),
                store.getStoreName(),
                store.getAddress(),
                cuisines,
                coverImage,
                contactPhone,
                store.getLatitude() != null ? store.getLatitude().doubleValue() : 21.1458,
                store.getLongitude() != null ? store.getLongitude().doubleValue() : 79.0882,
                "Free cancellation before dining start time. 100% cover charge refund.",
                store.getIsTableBookingEnabled() == null || Boolean.TRUE.equals(store.getIsTableBookingEnabled()),
                cashbackPct,
                maxCashback,
                minSpend,
                isCashbackActive,
                "PINAK Instant Transaction Cashback"
        );

        // 2. Query Store Active Offers FIRST to drive party size, discount badges, and slots
        List<Offer> activeOffers = fetchActiveStoreOffers(store);
        Offer primaryOffer = activeOffers.stream()
                .filter(o -> Boolean.TRUE.equals(o.getIsTableBookingEnabled()) || "PRE_BOOK".equalsIgnoreCase(o.getRedemptionType()))
                .findFirst()
                .orElse(!activeOffers.isEmpty() ? activeOffers.get(0) : null);

        // 3. Guest Limits & Presets dynamically resolved from active offer
        int minGuests = (primaryOffer != null && primaryOffer.getMinPartySize() != null && primaryOffer.getMinPartySize() > 0)
                ? primaryOffer.getMinPartySize()
                : 1;
        int maxGuests = (primaryOffer != null && primaryOffer.getMaxPartySize() != null && primaryOffer.getMaxPartySize() >= minGuests)
                ? primaryOffer.getMaxPartySize()
                : 8;
        int defaultGuests = Math.min(Math.max(2, minGuests), maxGuests);
        List<Integer> guestCounts = new ArrayList<>();
        for (int g = minGuests; g <= maxGuests; g++) {
            guestCounts.add(g);
        }
        GuestConfigDto guestConfig = new GuestConfigDto(
                minGuests,
                maxGuests,
                defaultGuests,
                guestCounts
        );

        // 4. Upcoming 7 Days Calendar with dynamic offer discount badge
        String baseDiscountBadge = resolveOfferDiscountBadge(primaryOffer);
        LocalDate today = LocalDate.now();
        List<BookingDateDto> upcomingDates = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate date = today.plusDays(i);
            String dayName = switch (i) {
                case 0 -> "Today";
                case 1 -> "Tomorrow";
                default -> date.getDayOfWeek().toString().substring(0, 1)
                        + date.getDayOfWeek().toString().substring(1, 3).toLowerCase(Locale.ROOT);
            };
            String month = date.getMonth().toString().substring(0, 1)
                    + date.getMonth().toString().substring(1, 3).toLowerCase(Locale.ROOT);
            String dayNum = String.format("%02d", date.getDayOfMonth());

            boolean isAvailableOnDate = isDateWithinOfferValidity(date, primaryOffer)
                    && isDateMatchingActiveDays(date, primaryOffer != null ? primaryOffer.getActiveDays() : null);
            String discountBadge = isAvailableOnDate ? baseDiscountBadge : "Standard";

            upcomingDates.add(new BookingDateDto(
                    date.format(DATE_KEY_FORMATTER),
                    date.format(DISPLAY_DATE_FORMATTER),
                    month,
                    dayNum,
                    dayName,
                    discountBadge,
                    true
            ));
        }

        // 5. Resolve Dynamic Lunch/Dinner Slots strictly sorted chronologically
        MealSlots mealSlots = resolveMealSlots(store, activeOffers);
        List<BookingTimeSlotDto> lunchSlots = mealSlots.lunch();
        List<BookingTimeSlotDto> dinnerSlots = mealSlots.dinner();

        // 6. Booking Offers (Exclusive Deals & Regular)
        boolean isBookingEnabled = store.getIsTableBookingEnabled() == null || Boolean.TRUE.equals(store.getIsTableBookingEnabled());
        boolean allowFreeStandard = store.getAllowFreeStandardBooking() == null || Boolean.TRUE.equals(store.getAllowFreeStandardBooking());
        BigDecimal defaultCoverCharge = store.getDefaultStandardCoverCharge() != null ? store.getDefaultStandardCoverCharge() : BigDecimal.ZERO;

        List<BookingOfferOptionDto> exclusiveOffers;
        BookingOfferOptionDto regularOffer = null;

        if (!isBookingEnabled) {
            exclusiveOffers = Collections.emptyList();
            lunchSlots = Collections.emptyList();
            dinnerSlots = Collections.emptyList();
        } else {
            exclusiveOffers = buildExclusiveOffers(activeOffers);
            if (allowFreeStandard) {
                regularOffer = new BookingOfferOptionDto(
                        "opt_regular",
                        "Standard table booking",
                        BigDecimal.ZERO,
                        BigDecimal.ZERO,
                        false,
                        true,
                        "Free table reservation without cover charge"
                );
            } else if (defaultCoverCharge.compareTo(BigDecimal.ZERO) > 0) {
                regularOffer = new BookingOfferOptionDto(
                        "opt_regular",
                        "Standard table booking",
                        BigDecimal.ZERO,
                        defaultCoverCharge,
                        false,
                        true,
                        "Standard cover charge of ₹" + defaultCoverCharge.stripTrailingZeros().toPlainString() + " (redeemable against final bill)"
                );
            }
        }

        // 7. Seating Areas from primary offer
        List<String> seatingAreas = parseJsonStringList(primaryOffer != null ? primaryOffer.getSeatingAreas() : null);
        if (seatingAreas.isEmpty()) {
            seatingAreas = List.of("Indoor AC Dining", "Outdoor / Rooftop");
        }

        // 6. VIP Membership Upsell (PINAK 1 Month VIP Plan)
        BookingVipPlanDto vipPlan = new BookingVipPlanDto(
                "pinak_vip_1m",
                "PINAK 1 Month Plan",
                new BigDecimal("1.00"),
                new BigDecimal("99.00"),
                "Enjoy unlimited access to pre-book offers on 7500+ restaurants.",
                true
        );

        // 7. Payment Methods Supported
        List<String> paymentMethods = List.of(
                "Google Pay",
                "PhonePe UPI",
                "Paytm UPI",
                "BHIM / Other UPI Apps",
                "Credit or Debit Card",
                "Netbanking"
        );

        // 8. Offer Terms & Conditions List loaded directly from database activeOffers
        List<String> termsAndConditions = new ArrayList<>();
        for (Offer o : activeOffers) {
            if (o.getTermsAndConditions() != null && !o.getTermsAndConditions().isBlank()) {
                String raw = o.getTermsAndConditions();
                for (String line : raw.split("\n")) {
                    String clean = line.replaceFirst("^[•\\-\\*\\d+\\.]\\s*", "").trim();
                    if (!clean.isEmpty() && !termsAndConditions.contains(clean)) {
                        termsAndConditions.add(clean);
                    }
                }
            }
        }

        if (termsAndConditions.isEmpty()) {
            termsAndConditions = List.of(
                    "Valid for dine-in reservations made via PINAK SuperApp only.",
                    "Flat discount applies on the total food and soft beverage bill before taxes.",
                    "The table reservation will be held for up to 15 minutes past the scheduled slot time; please arrive on time.",
                    "Cannot be clubbed or combined with any other in-store promotions, happy hours, or special buffet rates.",
                    "The full discount is redeemed automatically when settling the final dining bill through the PINAK app/QR.",
                    "Cover charges (if applicable) are 100% refundable if the booking is cancelled at least 2 hours prior to the slot time."
            );
        }

        // 9. Cancellation Policy Details
        BookingCancellationPolicyDto cancellationPolicy = new BookingCancellationPolicyDto(
                0,
                100,
                "Free cancellation up to dining slot start time. 100% of cover charge is automatically refunded to original payment method."
        );

        return new TableBookingAvailabilityResponse(
                storeHeader,
                guestConfig,
                upcomingDates,
                lunchSlots,
                dinnerSlots,
                exclusiveOffers,
                regularOffer,
                vipPlan,
                paymentMethods,
                termsAndConditions,
                cancellationPolicy,
                seatingAreas
        );
    }

    @Override
    @Transactional
    public TableBookingResponseDto createBooking(CreateTableBookingRequest request, String authHeader) {
        Store store = resolveStore(request.storeId());

        boolean isBookingEnabled = store.getIsTableBookingEnabled() == null || Boolean.TRUE.equals(store.getIsTableBookingEnabled());
        if (!isBookingEnabled) {
            throw new AppException("Table booking is currently disabled for this restaurant", ApiError.VALIDATION_ERROR, 400);
        }

        if ("opt_regular".equals(request.offerId())) {
            boolean allowFree = store.getAllowFreeStandardBooking() == null || Boolean.TRUE.equals(store.getAllowFreeStandardBooking());
            BigDecimal expectedCharge = allowFree ? BigDecimal.ZERO : store.getDefaultStandardCoverCharge();
            if (!allowFree && (expectedCharge == null || expectedCharge.compareTo(BigDecimal.ZERO) <= 0)) {
                throw new AppException("Standard table booking is not allowed for this store. Please select a pre-booking offer.", ApiError.VALIDATION_ERROR, 400);
            }
        }

        LocalDate bDate;
        try {
            bDate = LocalDate.parse(request.bookingDate(), DATE_KEY_FORMATTER);
        } catch (Exception e) {
            bDate = LocalDate.now();
        }

        UUID userId = extractUserIdFromHeader(authHeader);

        // Calculate cover charge and VIP plan
        BigDecimal coverChargePerGuest = request.coverChargePerGuest();
        if (coverChargePerGuest == null) {
            if ("opt_regular".equals(request.offerId())) {
                boolean allowFree = store.getAllowFreeStandardBooking() == null || Boolean.TRUE.equals(store.getAllowFreeStandardBooking());
                coverChargePerGuest = allowFree ? BigDecimal.ZERO : (store.getDefaultStandardCoverCharge() != null ? store.getDefaultStandardCoverCharge() : BigDecimal.ZERO);
            } else {
                coverChargePerGuest = new BigDecimal("25.00");
            }
        }
        int guests = request.guests() != null && request.guests() > 0 ? request.guests() : 2;
        BigDecimal totalCoverCharge = coverChargePerGuest.multiply(BigDecimal.valueOf(guests));

        boolean hasVip = Boolean.TRUE.equals(request.includeVipPlan());
        BigDecimal vipFee = hasVip
                ? (request.vipPlanFee() != null ? request.vipPlanFee() : BigDecimal.ONE)
                : BigDecimal.ZERO;
        BigDecimal totalPaid = totalCoverCharge.add(vipFee);

        // Generate Human-Readable Booking Reference & 4-Digit Verification Code
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMM"));
        int randomCode = 100000 + random.nextInt(900000);
        String bookingRef = "PNK-TB-" + datePart + "-" + randomCode;
        String verificationPin = String.format("%04d", 1000 + random.nextInt(9000));

        // 20% PINAK coins reward calculation
        int coinsEarned = totalPaid.multiply(BigDecimal.valueOf(20))
                .divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP)
                .intValue() + 50;

        User bookingUser = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String bCustomerName = (request.customerName() != null && !request.customerName().isBlank()
                && !"Customer".equalsIgnoreCase(request.customerName().trim())
                && !"Guest Diner".equalsIgnoreCase(request.customerName().trim()))
                ? request.customerName().trim()
                : (bookingUser != null && bookingUser.getName() != null && !bookingUser.getName().isBlank()
                        ? bookingUser.getName().trim()
                        : (request.customerName() != null && !request.customerName().isBlank() ? request.customerName().trim() : "Guest Diner"));

        String bCustomerPhone = (request.customerPhone() != null && !request.customerPhone().isBlank()
                && !"In-Store Diner".equalsIgnoreCase(request.customerPhone().trim()))
                ? request.customerPhone().trim()
                : (bookingUser != null && bookingUser.getPhone() != null && !bookingUser.getPhone().isBlank()
                        ? bookingUser.getPhone().trim()
                        : (request.customerPhone() != null && !request.customerPhone().isBlank() ? request.customerPhone().trim() : ""));

        TableBooking booking = new TableBooking();
        booking.setBookingRef(bookingRef);
        booking.setStoreId(store.getId());
        booking.setUserId(userId);
        booking.setCustomerName(bCustomerName);
        booking.setCustomerPhone(bCustomerPhone);
        booking.setCustomerEmail(request.customerEmail());
        booking.setGuests(guests);
        booking.setBookingDate(bDate);
        booking.setMealType(request.mealType() != null ? request.mealType().toUpperCase(Locale.ROOT) : "LUNCH");
        booking.setSlotTime(request.slotTime());
        booking.setOfferId(request.offerId() != null ? request.offerId() : "opt_primary");
        booking.setOfferTitle(request.offerTitle() != null ? request.offerTitle() : "Flat 20% off on Total Bill");
        booking.setDiscountPct(request.discountPct() != null ? request.discountPct() : new BigDecimal("20.00"));
        booking.setCoverChargePerGuest(coverChargePerGuest);
        booking.setTotalCoverCharge(totalCoverCharge);
        booking.setIncludeVipPlan(hasVip);
        booking.setVipPlanFee(vipFee);
        booking.setTotalPaid(totalPaid);
        booking.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : "Google Pay");
        booking.setPaymentStatus("PAID");
        booking.setStatus("CONFIRMED");
        booking.setVerificationCode(verificationPin);
        booking.setSpecialRequests(request.specialRequests());
        booking.setCoinsEarned(coinsEarned);

        TableBooking saved = tableBookingRepository.save(booking);
        log.info("Created table booking with ref: {} for store: {} on {}", bookingRef, store.getStoreName(), bDate);

        return mapToResponseDto(saved, store);
    }

    @Override
    @Transactional(readOnly = true)
    public TableBookingResponseDto getBookingDetails(String idOrRef) {
        TableBooking booking = findBookingByIdOrRef(idOrRef);
        Store store = resolveStore(booking.getStoreId());
        return mapToResponseDto(booking, store);
    }

    @Override
    @Transactional
    public TableBookingResponseDto cancelBooking(String idOrRef, CancelTableBookingRequest cancelRequest) {
        TableBooking booking = findBookingByIdOrRef(idOrRef);
        if ("CANCELLED".equalsIgnoreCase(booking.getStatus())) {
            Store store = resolveStore(booking.getStoreId());
            return mapToResponseDto(booking, store);
        }

        booking.setStatus("CANCELLED");
        booking.setCancelledAt(Instant.now());
        booking.setCancellationReason(cancelRequest.cancellationReason());
        booking.setCancellationComments(cancelRequest.comments());

        // Full refund of total cover charge
        booking.setRefundAmount(booking.getTotalCoverCharge());
        booking.setRefundStatus("INITIATED");
        booking.setRefundRef("REF-PNK-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(Locale.ROOT));

        TableBooking updated = tableBookingRepository.save(booking);
        log.info("Cancelled table booking {} with refund amount {}", booking.getBookingRef(), booking.getRefundAmount());

        Store store = resolveStore(updated.getStoreId());
        return mapToResponseDto(updated, store);
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableBookingResponseDto> getUserBookings(String customerPhone, String authHeader) {
        UUID userId = extractUserIdFromHeader(authHeader);
        List<TableBooking> bookings;

        if (userId != null) {
            bookings = tableBookingRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (bookings.isEmpty() && customerPhone != null && !customerPhone.isBlank()) {
                bookings = tableBookingRepository.findByCustomerPhoneOrderByCreatedAtDesc(customerPhone.trim());
            }
        } else if (customerPhone != null && !customerPhone.isBlank()) {
            bookings = tableBookingRepository.findByCustomerPhoneOrderByCreatedAtDesc(customerPhone.trim());
        } else {
            bookings = tableBookingRepository.findAll(PageRequest.of(0, 10)).getContent();
        }

        return bookings.stream()
                .map(b -> mapToResponseDto(b, resolveStore(b.getStoreId())))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<TableBookingResponseDto> listBookings(UUID storeId, UUID merchantId, String status, String dateKey, String search) {
        List<TableBooking> bookings;
        if (storeId != null) {
            bookings = tableBookingRepository.findByStoreIdOrderByCreatedAtDesc(storeId);
        } else if (merchantId != null) {
            List<Store> merchantStores = storeRepository.findByMerchantId(merchantId);
            if (merchantStores.isEmpty()) {
                bookings = Collections.emptyList();
            } else {
                List<UUID> storeIds = merchantStores.stream().map(Store::getId).toList();
                bookings = tableBookingRepository.findByStoreIdInOrderByCreatedAtDesc(storeIds);
            }
        } else {
            bookings = tableBookingRepository.findAllByOrderByCreatedAtDesc();
        }

        // Apply filters
        LocalDate filterDate = null;
        if (dateKey != null && !dateKey.isBlank() && !"ALL".equalsIgnoreCase(dateKey)) {
            try {
                filterDate = LocalDate.parse(dateKey.trim(), DATE_KEY_FORMATTER);
            } catch (Exception ignored) {}
        }

        final LocalDate finalDate = filterDate;
        final String searchLower = search != null ? search.trim().toLowerCase(Locale.ROOT) : null;
        final String statusUpper = status != null && !"ALL".equalsIgnoreCase(status) ? status.trim().toUpperCase(Locale.ROOT) : null;

        Map<UUID, Store> storeCache = new HashMap<>();

        return bookings.stream()
                .filter(b -> {
                    if (statusUpper != null && !statusUpper.equalsIgnoreCase(b.getStatus())) {
                        return false;
                    }
                    if (finalDate != null && !finalDate.equals(b.getBookingDate())) {
                        return false;
                    }
                    if (searchLower != null && !searchLower.isBlank()) {
                        boolean matchRef = b.getBookingRef() != null && b.getBookingRef().toLowerCase(Locale.ROOT).contains(searchLower);
                        boolean matchName = b.getCustomerName() != null && b.getCustomerName().toLowerCase(Locale.ROOT).contains(searchLower);
                        boolean matchPhone = b.getCustomerPhone() != null && b.getCustomerPhone().contains(searchLower);
                        boolean matchSlot = b.getSlotTime() != null && b.getSlotTime().toLowerCase(Locale.ROOT).contains(searchLower);
                        return matchRef || matchName || matchPhone || matchSlot;
                    }
                    return true;
                })
                .map(b -> {
                    Store store = storeCache.computeIfAbsent(b.getStoreId(), this::resolveStore);
                    return mapToResponseDto(b, store);
                })
                .toList();
    }

    @Override
    @Transactional
    public TableBookingResponseDto updateBookingStatus(String idOrRef, String newStatus, String cancellationReason, String comments) {
        TableBooking booking = findBookingByIdOrRef(idOrRef);
        String upperStatus = newStatus != null ? newStatus.trim().toUpperCase(Locale.ROOT) : "CONFIRMED";
        booking.setStatus(upperStatus);

        if ("CANCELLED".equals(upperStatus)) {
            booking.setCancelledAt(Instant.now());
            if (cancellationReason != null && !cancellationReason.isBlank()) {
                booking.setCancellationReason(cancellationReason);
            }
            if (comments != null && !comments.isBlank()) {
                booking.setCancellationComments(comments);
            }
            if (booking.getTotalCoverCharge() != null && booking.getTotalCoverCharge().compareTo(BigDecimal.ZERO) > 0) {
                booking.setRefundAmount(booking.getTotalCoverCharge());
                booking.setRefundStatus("REFUNDED");
                booking.setRefundRef("REF-" + booking.getBookingRef());
            }
        }

        TableBooking saved = tableBookingRepository.save(booking);
        Store store = resolveStore(saved.getStoreId());
        log.info("Updated booking {} status to {}", booking.getBookingRef(), upperStatus);
        return mapToResponseDto(saved, store);
    }

    @Override
    @Transactional
    public TableBookingResponseDto setBillAmount(String idOrRef, BigDecimal billAmount) {
        TableBooking booking = findBookingByIdOrRef(idOrRef);
        booking.setBillAmount(billAmount);
        booking.setBillAddedAt(Instant.now());
        if ("CONFIRMED".equalsIgnoreCase(booking.getStatus())) {
            booking.setStatus("SEATED");
        }
        TableBooking saved = tableBookingRepository.save(booking);
        Store store = resolveStore(saved.getStoreId());
        log.info("Attached food bill amount {} to booking ref {}", billAmount, booking.getBookingRef());
        return mapToResponseDto(saved, store);
    }

    // --- Internal Helpers ---

    private Store resolveStore(UUID storeId) {
        if (storeId != null) {
            Optional<Store> storeOpt = storeRepository.findById(storeId);
            if (storeOpt.isPresent()) {
                return storeOpt.get();
            }
        }
        throw new ResourceNotFoundException("Store", "id", storeId);
    }

    private List<Offer> fetchActiveStoreOffers(Store store) {
        try {
            return offerRepository.findActiveOffersByStoreOrMerchant(
                    store.getId(),
                    store.getMerchantId(),
                    Instant.now(),
                    PageRequest.of(0, 10)
            ).getContent();
        } catch (Exception e) {
            log.warn("Could not query active store offers: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private record MealSlots(List<BookingTimeSlotDto> lunch, List<BookingTimeSlotDto> dinner) {}

    private MealSlots resolveMealSlots(Store store, List<Offer> activeOffers) {
        List<String> rawSlots = new ArrayList<>();
        String discountText = "20% off";
        boolean hasConfiguredSlots = false;

        // 1. Try to find real slot_times on active pre-booking offers from DB
        for (Offer o : activeOffers) {
            if (o.getSlotTimes() != null && !o.getSlotTimes().isBlank() && !"[]".equals(o.getSlotTimes().trim())) {
                rawSlots = parseSlotTimes(o.getSlotTimes());
                if (!rawSlots.isEmpty()) {
                    discountText = resolveOfferDiscountBadge(o);
                    hasConfiguredSlots = true;
                    break;
                }
            }
        }

        // 2. If no offer defines slot_times, generate slots from store opening and closing hours
        if (rawSlots.isEmpty() && store.getOpeningTime() != null && store.getClosingTime() != null) {
            rawSlots = generateSlotsFromOperatingHours(store.getOpeningTime(), store.getClosingTime());
            if (!rawSlots.isEmpty()) {
                hasConfiguredSlots = true;
            }
        }

        // 3. Fallback to standard restaurant hours if neither is available
        if (rawSlots.isEmpty()) {
            rawSlots = List.of(
                    "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM", "03:00 PM",
                    "07:00 PM", "07:30 PM", "08:00 PM", "08:30 PM", "09:00 PM", "09:30 PM", "10:00 PM"
            );
        }

        // ALWAYS strictly sort all slot times chronologically
        List<String> sortedSlots = rawSlots.stream()
                .distinct()
                .sorted(Comparator.comparing(TableBookingServiceImpl::parseSlotLocalTime))
                .toList();

        // Divide into lunch (< 5 PM) and dinner (>= 5 PM)
        List<BookingTimeSlotDto> lunch = new ArrayList<>();
        List<BookingTimeSlotDto> dinner = new ArrayList<>();

        for (String slot : sortedSlots) {
            boolean isLunch = isLunchSlot(slot);
            BookingTimeSlotDto slotDto = new BookingTimeSlotDto(slot, discountText, "AVAILABLE", true);
            if (isLunch) {
                lunch.add(slotDto);
            } else {
                dinner.add(slotDto);
            }
        }

        // Only inject fallback default slots if NEITHER offer nor store configured any slots at all
        if (!hasConfiguredSlots && lunch.isEmpty() && dinner.isEmpty()) {
            lunch = List.of(
                    new BookingTimeSlotDto("12:00 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("12:30 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("01:00 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("01:30 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("02:00 PM", discountText, "AVAILABLE", true)
            );
            dinner = List.of(
                    new BookingTimeSlotDto("07:00 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("07:30 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("08:00 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("08:30 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("09:00 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("09:30 PM", discountText, "AVAILABLE", true),
                    new BookingTimeSlotDto("10:00 PM", discountText, "AVAILABLE", true)
            );
        }

        return new MealSlots(lunch, dinner);
    }

    public static LocalTime parseSlotLocalTime(String slotTime) {
        if (slotTime == null || slotTime.isBlank()) {
            return LocalTime.MIDNIGHT;
        }
        String clean = slotTime.trim().toUpperCase(Locale.ENGLISH).replaceAll("\\s+", " ");
        clean = clean.replaceAll("(?i)(\\d)(AM|PM)", "$1 $2");
        try {
            return LocalTime.parse(clean, DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
        } catch (Exception e1) {
            try {
                return LocalTime.parse(clean, DateTimeFormatter.ofPattern("h:mm a", Locale.ENGLISH));
            } catch (Exception e2) {
                try {
                    return LocalTime.parse(clean, DateTimeFormatter.ofPattern("HH:mm"));
                } catch (Exception e3) {
                    java.util.regex.Matcher m = java.util.regex.Pattern.compile("(\\d+):(\\d+)\\s*(AM|PM)?", java.util.regex.Pattern.CASE_INSENSITIVE).matcher(clean);
                    if (m.find()) {
                        int h = Integer.parseInt(m.group(1));
                        int min = Integer.parseInt(m.group(2));
                        String ap = m.group(3);
                        if (ap != null) {
                            if ("PM".equalsIgnoreCase(ap) && h < 12) h += 12;
                            if ("AM".equalsIgnoreCase(ap) && h == 12) h = 0;
                        }
                        return LocalTime.of(h, min);
                    }
                    return LocalTime.MIDNIGHT;
                }
            }
        }
    }

    private boolean isLunchSlot(String slotTime) {
        LocalTime lt = parseSlotLocalTime(slotTime);
        return lt.isBefore(LocalTime.of(17, 0));
    }

    private String resolveOfferDiscountBadge(Offer offer) {
        if (offer == null || offer.getValue() == null) {
            return "20% off";
        }
        int val = offer.getValue().intValue();
        if (offer.getType() == com.superapp.offer.enums.OfferType.PERCENTAGE_DISCOUNT || val > 0) {
            return val + "% off";
        }
        return "Special";
    }

    private boolean isDateWithinOfferValidity(LocalDate date, Offer offer) {
        if (offer == null) return true;
        if (offer.getValidFrom() != null && date.isBefore(offer.getValidFrom().atZone(java.time.ZoneId.systemDefault()).toLocalDate())) {
            return false;
        }
        if (offer.getValidTo() != null && date.isAfter(offer.getValidTo().atZone(java.time.ZoneId.systemDefault()).toLocalDate())) {
            return false;
        }
        return true;
    }

    private boolean isDateMatchingActiveDays(LocalDate date, String activeDaysJson) {
        if (activeDaysJson == null || activeDaysJson.isBlank() || "[]".equals(activeDaysJson.trim())) {
            return true;
        }
        List<String> days = parseJsonStringList(activeDaysJson);
        if (days.isEmpty()) return true;
        String dayName = date.getDayOfWeek().name().toLowerCase(Locale.ROOT);
        String dayShort = dayName.substring(0, Math.min(3, dayName.length()));
        for (String d : days) {
            String clean = d.trim().toLowerCase(Locale.ROOT);
            if (clean.startsWith(dayShort) || dayName.equalsIgnoreCase(clean)) {
                return true;
            }
        }
        return false;
    }

    private List<String> parseJsonStringList(String json) {
        if (json == null || json.isBlank()) return Collections.emptyList();
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(json, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            String cleaned = json.replaceAll("[\\[\\]\"']", "").trim();
            if (cleaned.isEmpty()) return Collections.emptyList();
            return Arrays.stream(cleaned.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

    private List<String> parseSlotTimes(String slotTimesJson) {
        if (slotTimesJson == null || slotTimesJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            ObjectMapper mapper = new ObjectMapper();
            return mapper.readValue(slotTimesJson, new TypeReference<List<String>>() {});
        } catch (Exception e) {
            String cleaned = slotTimesJson.replaceAll("[\\[\\]\"']", "").trim();
            if (cleaned.isEmpty()) return Collections.emptyList();
            return Arrays.stream(cleaned.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .toList();
        }
    }

    private List<String> generateSlotsFromOperatingHours(String openTime, String closeTime) {
        List<String> slots = new ArrayList<>();
        try {
            int openHour = Integer.parseInt(openTime.split(":")[0]);
            int closeHour = Integer.parseInt(closeTime.split(":")[0]);

            for (int h = Math.max(openHour, 11); h < Math.min(closeHour, 23); h++) {
                if (h >= 16 && h < 18) continue; // afternoon break
                for (int min : new int[]{0, 30}) {
                    int displayHour = (h == 0 || h == 12) ? 12 : (h > 12 ? h - 12 : h);
                    String ampm = h >= 12 ? "PM" : "AM";
                    slots.add(String.format("%02d:%02d %s", displayHour, min, ampm));
                }
            }
        } catch (Exception ignored) {}
        return slots;
    }

    private List<BookingOfferOptionDto> buildExclusiveOffers(List<Offer> activeOffers) {
        List<BookingOfferOptionDto> list = new ArrayList<>();
        for (Offer o : activeOffers) {
            if (Boolean.TRUE.equals(o.getIsTableBookingEnabled()) || !"PRODUCT".equalsIgnoreCase(o.getOfferScope())) {
                BigDecimal cover = o.getCoverChargeAmount() != null ? o.getCoverChargeAmount() : BigDecimal.ZERO;
                BigDecimal disc = o.getValue() != null ? o.getValue() : new BigDecimal("20.00");
                List<String> slotList = parseSlotTimes(o.getSlotTimes());
                if (!slotList.isEmpty()) {
                    slotList = slotList.stream()
                            .distinct()
                            .sorted(Comparator.comparing(TableBookingServiceImpl::parseSlotLocalTime))
                            .toList();
                }
                List<String> seatingList = parseJsonStringList(o.getSeatingAreas());
                if (seatingList.isEmpty()) {
                    seatingList = List.of("Indoor AC Dining", "Outdoor / Rooftop");
                }
                list.add(new BookingOfferOptionDto(
                        o.getId().toString(),
                        o.getTitle(),
                        disc,
                        cover,
                        true,
                        false,
                        "Redeem it by paying final bill via PINAK",
                        o.getMinPartySize() != null ? o.getMinPartySize() : 1,
                        o.getMaxPartySize() != null ? o.getMaxPartySize() : 8,
                        slotList,
                        seatingList,
                        o.getTermsAndConditions()
                ));
            }
        }

        if (list.isEmpty()) {
            list.add(new BookingOfferOptionDto(
                    "opt_primary",
                    "Flat 20% off on Total Bill",
                    new BigDecimal("20.00"),
                    BigDecimal.ZERO,
                    true,
                    false,
                    "Redeem it by paying final bill via PINAK",
                    1,
                    8,
                    Collections.emptyList(),
                    List.of("Indoor AC Dining", "Outdoor / Rooftop"),
                    null
            ));
            list.add(new BookingOfferOptionDto(
                    "opt_15",
                    "Flat 15% off on Total Bill",
                    new BigDecimal("15.00"),
                    BigDecimal.ZERO,
                    true,
                    false,
                    "Redeem it by paying final bill via PINAK",
                    1,
                    8,
                    Collections.emptyList(),
                    List.of("Indoor AC Dining", "Outdoor / Rooftop"),
                    null
            ));
            list.add(new BookingOfferOptionDto(
                    "opt_10",
                    "Flat 10% off on Total Bill",
                    new BigDecimal("10.00"),
                    BigDecimal.ZERO,
                    true,
                    false,
                    "Redeem it by paying final bill via PINAK",
                    1,
                    8,
                    Collections.emptyList(),
                    List.of("Indoor AC Dining", "Outdoor / Rooftop"),
                    null
            ));
        }

        return list;
    }

    private TableBooking findBookingByIdOrRef(String idOrRef) {
        if (idOrRef == null || idOrRef.isBlank()) {
            throw new ResourceNotFoundException("TableBooking", "idOrRef", idOrRef);
        }
        try {
            UUID id = UUID.fromString(idOrRef.trim());
            return tableBookingRepository.findById(id)
                    .orElseGet(() -> tableBookingRepository.findByBookingRef(idOrRef.trim())
                            .orElseThrow(() -> new ResourceNotFoundException("TableBooking", "id", idOrRef)));
        } catch (IllegalArgumentException e) {
            return tableBookingRepository.findByBookingRef(idOrRef.trim())
                    .orElseThrow(() -> new ResourceNotFoundException("TableBooking", "bookingRef", idOrRef));
        }
    }

    private UUID extractUserIdFromHeader(String authHeader) {
        if (authHeader != null && !authHeader.isBlank()) {
            try {
                String rawToken = authHeader.startsWith("Bearer ")
                        ? authHeader.substring(7).trim()
                        : authHeader.trim();
                if (jwtService.isValidAccessToken(rawToken)) {
                    return jwtService.extractUserId(rawToken);
                }
            } catch (Exception e) {
                log.debug("No valid user JWT in Authorization header: {}", e.getMessage());
            }
        }
        return null;
    }

    private TableBookingResponseDto mapToResponseDto(TableBooking booking, Store store) {
        boolean isCancelled = "CANCELLED".equalsIgnoreCase(booking.getStatus());
        String formattedDate = booking.getBookingDate() != null
                ? booking.getBookingDate().format(DISPLAY_DATE_FORMATTER)
                : LocalDate.now().format(DISPLAY_DATE_FORMATTER);

        String coverImage = store.getImageUrl() != null && !store.getImageUrl().isBlank()
                ? store.getImageUrl()
                : "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80";
        String contactPhone = store.getPhone() != null && !store.getPhone().isBlank()
                ? store.getPhone()
                : "+919880011234";

        Instant cancellationDeadline = booking.getCreatedAt() != null
                ? booking.getCreatedAt().plus(12, ChronoUnit.HOURS)
                : Instant.now().plus(12, ChronoUnit.HOURS);

        String qrCodeData = "{\"bookingRef\":\"" + booking.getBookingRef()
                + "\",\"storeId\":\"" + booking.getStoreId()
                + "\",\"pin\":\"" + (booking.getVerificationCode() != null ? booking.getVerificationCode() : "8492")
                + "\",\"guests\":" + booking.getGuests()
                + "}";

        List<String> diningInstructions = List.of(
                "Please arrive at " + store.getStoreName() + " 10 minutes prior to your booking slot.",
                "Show your Reservation ID (" + booking.getBookingRef() + ") or 4-digit PIN to the restaurant host upon arrival.",
                "Tables are held for a maximum 15-minute grace period from the slot time.",
                "Pay your final dining bill through the PINAK app at the table to automatically redeem your ₹"
                        + booking.getTotalCoverCharge() + " cover charge and unlock locked offer discount."
        );

        // Fallback to registered user account name/phone if booking customerName is empty or generic placeholder
        String resolvedCustName = booking.getCustomerName();
        String resolvedCustPhone = booking.getCustomerPhone();
        if ((resolvedCustName == null || resolvedCustName.isBlank()
                || "Customer".equalsIgnoreCase(resolvedCustName.trim())
                || "Guest Diner".equalsIgnoreCase(resolvedCustName.trim())
                || "Walk-in Guest".equalsIgnoreCase(resolvedCustName.trim()))
                && booking.getUserId() != null) {
            Optional<User> uOpt = userRepository.findById(booking.getUserId());
            if (uOpt.isPresent()) {
                User u = uOpt.get();
                if (u.getName() != null && !u.getName().isBlank()) {
                    resolvedCustName = u.getName().trim();
                }
                if ((resolvedCustPhone == null || resolvedCustPhone.isBlank() || "In-Store Diner".equalsIgnoreCase(resolvedCustPhone.trim()))
                        && u.getPhone() != null && !u.getPhone().isBlank()) {
                    resolvedCustPhone = u.getPhone().trim();
                }
            }
        }
        if (resolvedCustName == null || resolvedCustName.isBlank()) {
            resolvedCustName = "Guest Diner";
        }
        if (resolvedCustPhone == null || resolvedCustPhone.isBlank()) {
            resolvedCustPhone = "In-Store Diner";
        }

        return new TableBookingResponseDto(
                booking.getId(),
                booking.getBookingRef(),
                store.getId(),
                store.getStoreName(),
                store.getAddress(),
                coverImage,
                contactPhone,
                resolvedCustName,
                resolvedCustPhone,
                booking.getCustomerEmail(),
                booking.getGuests(),
                booking.getBookingDate() != null ? booking.getBookingDate().format(DATE_KEY_FORMATTER) : null,
                formattedDate,
                booking.getMealType(),
                booking.getSlotTime(),
                booking.getOfferTitle(),
                booking.getDiscountPct(),
                booking.getCoverChargePerGuest(),
                booking.getTotalCoverCharge(),
                booking.getIncludeVipPlan(),
                booking.getVipPlanFee(),
                booking.getTotalPaid(),
                booking.getPaymentMethod(),
                booking.getPaymentStatus(),
                booking.getStatus(),
                booking.getVerificationCode(),
                qrCodeData,
                cancellationDeadline,
                !isCancelled,
                isCancelled,
                booking.getCancellationReason(),
                booking.getCancelledAt(),
                booking.getRefundAmount(),
                booking.getRefundStatus(),
                booking.getRefundRef(),
                booking.getCoinsEarned(),
                diningInstructions,
                booking.getSpecialRequests(),
                booking.getCreatedAt(),
                booking.getBillAmount(),
                booking.getBillAddedAt()
        );
    }

    @Override
    @Transactional
    public PayDiningBillResponse payDiningBill(PayDiningBillRequest request, String authHeader) {
        log.info("Processing in-store dining bill payment for storeId={}, bookingRef={}", request.storeId(), request.bookingRef());

        // 1. Resolve Store
        UUID storeUuid = null;
        if (request.storeId() != null && !request.storeId().isBlank()) {
            try {
                storeUuid = UUID.fromString(request.storeId().trim());
            } catch (Exception ignored) {}
        }
        Store store = resolveStore(storeUuid);

        // 2. Resolve Merchant
        UUID merchantId = store.getMerchantId();
        if (merchantId == null) {
            merchantId = storeRepository.findAll().stream()
                    .map(Store::getMerchantId)
                    .filter(Objects::nonNull)
                    .findFirst()
                    .orElse(UUID.fromString("520d3b3e-ff2c-463b-bd62-fe4035dd396f"));
        }

        // 3. Resolve Customer User
        UUID customerId = extractUserIdFromHeader(authHeader);
        if (customerId == null && request.customerPhone() != null && !request.customerPhone().isBlank()) {
            String p = request.customerPhone().trim();
            String digitsOnly = p.replaceAll("[^0-9]", "");
            customerId = userRepository.findByPhone(p)
                    .or(() -> digitsOnly.isBlank() ? Optional.empty() : userRepository.findByPhone(digitsOnly))
                    .or(() -> digitsOnly.length() >= 10 ? userRepository.findByPhone("+91" + digitsOnly.substring(digitsOnly.length() - 10)) : Optional.empty())
                    .map(com.superapp.user.entity.User::getId)
                    .orElse(null);
        }
        if (customerId == null) {
            // Default to first existing valid customer from the database or create guest user
            customerId = userRepository.findAll().stream()
                    .filter(u -> u.getRole() == Role.CUSTOMER)
                    .map(User::getId)
                    .findFirst()
                    .orElseGet(() -> {
                        User guestUser = new User();
                        String phone = (request.customerPhone() != null && !request.customerPhone().isBlank())
                                ? request.customerPhone().trim()
                                : "+919999999999";
                        guestUser.setPhone(phone);
                        guestUser.setName(request.customerName() != null && !request.customerName().isBlank() ? request.customerName() : "Guest Diner");
                        guestUser.setEmail(phone.replace("+", "") + "@pinak.app.internal");
                        guestUser.setPassword("$2a$10$placeholder");
                        guestUser.setRole(Role.CUSTOMER);
                        guestUser.setStatus(UserStatus.ACTIVE);
                        return userRepository.save(guestUser).getId();
                    });
        }

        // Fetch authenticated customer profile details to ensure the authentic logged-in user name is attached
        User customerUser = customerId != null ? userRepository.findById(customerId).orElse(null) : null;
        String effectiveCustomerName;
        if (request.customerName() != null && !request.customerName().isBlank()
                && !"Customer".equalsIgnoreCase(request.customerName().trim())
                && !"Guest Diner".equalsIgnoreCase(request.customerName().trim())
                && !"Walk-in Guest".equalsIgnoreCase(request.customerName().trim())) {
            effectiveCustomerName = request.customerName().trim();
        } else if (customerUser != null && customerUser.getName() != null && !customerUser.getName().isBlank()) {
            effectiveCustomerName = customerUser.getName().trim();
        } else if (request.customerName() != null && !request.customerName().isBlank()) {
            effectiveCustomerName = request.customerName().trim();
        } else {
            effectiveCustomerName = "Guest Diner";
        }

        String effectiveCustomerPhone;
        if (request.customerPhone() != null && !request.customerPhone().isBlank()
                && !"In-Store Diner".equalsIgnoreCase(request.customerPhone().trim())) {
            effectiveCustomerPhone = request.customerPhone().trim();
        } else if (customerUser != null && customerUser.getPhone() != null && !customerUser.getPhone().isBlank()) {
            effectiveCustomerPhone = customerUser.getPhone().trim();
        } else if (request.customerPhone() != null && !request.customerPhone().isBlank()) {
            effectiveCustomerPhone = request.customerPhone().trim();
        } else {
            effectiveCustomerPhone = "In-Store Diner";
        }

        // 4. Calculate Financials
        BigDecimal billAmount = request.billAmount() != null && request.billAmount().compareTo(BigDecimal.ZERO) > 0
                ? request.billAmount()
                : new BigDecimal("2000.00");
        BigDecimal discountAmount = request.discountAmount() != null ? request.discountAmount() : BigDecimal.ZERO;
        BigDecimal tipAmount = request.tipAmount() != null ? request.tipAmount() : BigDecimal.ZERO;
        BigDecimal totalPaid = request.totalPaid() != null && request.totalPaid().compareTo(BigDecimal.ZERO) > 0
                ? request.totalPaid()
                : billAmount.subtract(discountAmount).add(tipAmount);
        if (totalPaid.compareTo(BigDecimal.ZERO) < 0) {
            totalPaid = BigDecimal.ZERO;
        }

        // Determine cashback percentage and max cap from store configuration (managed by Super Admin)
        BigDecimal cashbackPct = (store.getCashbackPercentage() != null && store.getCashbackPercentage().compareTo(BigDecimal.ZERO) > 0)
                ? store.getCashbackPercentage()
                : new BigDecimal("5.00");
        BigDecimal maxCashback = (store.getMaxCashbackAmount() != null && store.getMaxCashbackAmount().compareTo(BigDecimal.ZERO) > 0)
                ? store.getMaxCashbackAmount()
                : new BigDecimal("150.00");
        BigDecimal minSpend = (store.getMinTransactionForCashback() != null)
                ? store.getMinTransactionForCashback()
                : new BigDecimal("100.00");
        boolean isCashbackActive = store.getIsCashbackEnabled() == null || Boolean.TRUE.equals(store.getIsCashbackEnabled());

        int coinsEarned = 0;
        if (isCashbackActive && totalPaid.compareTo(minSpend) >= 0) {
            BigDecimal rawCoins = totalPaid.multiply(cashbackPct).divide(BigDecimal.valueOf(100), RoundingMode.HALF_UP);
            if (maxCashback != null && maxCashback.compareTo(BigDecimal.ZERO) > 0 && rawCoins.compareTo(maxCashback) > 0) {
                rawCoins = maxCashback;
            }
            coinsEarned = rawCoins.intValue();
        }
        if (coinsEarned == 0 && request.coinsEarned() != null && request.coinsEarned() > 0) {
            coinsEarned = request.coinsEarned();
        }
        final int finalCoinsEarned = coinsEarned;

        // 5. Generate Human-Readable Transaction Reference & Receipt
        String txnRef = "PNK-TXN-" + String.format("%08d", 10000000 + random.nextInt(90000000));
        String receiptNumber = "REC-" + txnRef.replace("PNK-TXN-", "");
        String timestamp = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a"));

        String storeDisplayName = (request.storeName() != null && !request.storeName().isBlank())
                ? request.storeName()
                : (store.getStoreName() != null ? store.getStoreName() : store.getName());

        // 6. Persist Financial Ledger Transaction
        Transaction tx = new Transaction();
        tx.setTransactionReference(txnRef);
        tx.setUserId(customerId);
        tx.setCustomerId(customerId);
        tx.setMerchantId(merchantId);
        tx.setStoreId(store.getId());
        tx.setGrossAmount(billAmount);
        tx.setDiscountAmount(discountAmount);
        tx.setPayableAmount(totalPaid);
        tx.setAmount(totalPaid);
        tx.setCurrency("INR");
        tx.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : "Google Pay");
        tx.setType(TransactionType.PAYMENT);
        tx.setStatus(TransactionStatus.SUCCESS);
        tx.setPointsAwarded(coinsEarned);
        tx.setDescription("Dining bill payment at " + storeDisplayName + " [Ref: " + txnRef + "]");
        tx = transactionRepository.save(tx);

        // Credit Customer Reward Account Wallet (PINAK Coins) & Record in Ledger
        if (coinsEarned > 0 && rewardService != null) {
            try {
                rewardService.creditCashbackReward(
                        customerId,
                        tx.getId(),
                        BigDecimal.valueOf(coinsEarned),
                        "PINAK Coins (" + coinsEarned + " coins) cashback for dining bill at " + storeDisplayName
                );
                log.info("Credited {} PINAK Coins to customerId={} wallet", coinsEarned, customerId);
            } catch (Exception ex) {
                log.warn("Failed to credit customer reward account for tx {}: {}", tx.getTransactionReference(), ex.getMessage());
            }
        }

        final BigDecimal finalTotalPaid = totalPaid;

        // 7. If linked to an active Table Booking, mark it COMPLETED / SETTLED
        String matchedBookingRef = null;
        if (request.bookingRef() != null && !request.bookingRef().isBlank()) {
            matchedBookingRef = request.bookingRef().trim();
        } else if (request.bookingId() != null && !request.bookingId().isBlank()) {
            matchedBookingRef = request.bookingId().trim();
        } else if (store.getId() != null) {
            // Auto-link active or seated table booking for this store
            List<TableBooking> activeStoreBookings = tableBookingRepository.findByStoreIdOrderByCreatedAtDesc(store.getId());
            Optional<TableBooking> candidate = activeStoreBookings.stream()
                    .filter(b -> !"CANCELLED".equalsIgnoreCase(b.getStatus()) && !"COMPLETED".equalsIgnoreCase(b.getStatus()))
                    .filter(b -> "SEATED".equalsIgnoreCase(b.getStatus()) || (request.customerPhone() != null && request.customerPhone().equals(b.getCustomerPhone())))
                    .findFirst();
            if (candidate.isPresent()) {
                matchedBookingRef = candidate.get().getBookingRef();
            }
        }

        if (matchedBookingRef != null) {
            Optional<TableBooking> bookingOpt = tableBookingRepository.findByBookingRef(matchedBookingRef);
            if (bookingOpt.isEmpty()) {
                try {
                    bookingOpt = tableBookingRepository.findById(UUID.fromString(matchedBookingRef));
                } catch (Exception ignored) {}
            }

            bookingOpt.ifPresent(booking -> {
                booking.setStatus("COMPLETED");
                booking.setPaymentStatus("PAID");
                booking.setCoinsEarned(booking.getCoinsEarned() != null ? booking.getCoinsEarned() + finalCoinsEarned : finalCoinsEarned);
                if (booking.getBillAmount() == null || booking.getBillAmount().compareTo(BigDecimal.ZERO) == 0) {
                    booking.setBillAmount(billAmount);
                    booking.setBillAddedAt(Instant.now());
                }
                if ((booking.getCustomerName() == null || booking.getCustomerName().isBlank()
                        || "Customer".equalsIgnoreCase(booking.getCustomerName().trim())
                        || "Guest Diner".equalsIgnoreCase(booking.getCustomerName().trim())
                        || "Walk-in Guest".equalsIgnoreCase(booking.getCustomerName().trim()))
                        && effectiveCustomerName != null) {
                    booking.setCustomerName(effectiveCustomerName);
                }
                if ((booking.getCustomerPhone() == null || booking.getCustomerPhone().isBlank()
                        || "In-Store Diner".equalsIgnoreCase(booking.getCustomerPhone().trim()))
                        && effectiveCustomerPhone != null) {
                    booking.setCustomerPhone(effectiveCustomerPhone);
                }
                tableBookingRepository.save(booking);
                log.info("Marked reservation {} as COMPLETED following bill payment of ₹{}", booking.getBookingRef(), finalTotalPaid);
            });
        } else {
            // Direct Walk-In Payment without prior table reservation:
            // Persist a walk-in dining settlement in table_bookings so it displays in Table Bookings dashboards
            TableBooking walkInBooking = new TableBooking();
            walkInBooking.setBookingRef("PNK-WI-" + String.format("%08d", 10000000 + random.nextInt(90000000)));
            walkInBooking.setStoreId(store.getId());
            walkInBooking.setUserId(customerId);
            walkInBooking.setCustomerName(effectiveCustomerName);
            walkInBooking.setCustomerPhone(effectiveCustomerPhone);
            walkInBooking.setGuests(2);
            walkInBooking.setBookingDate(LocalDate.now());
            walkInBooking.setMealType(LocalTime.now().getHour() < 16 ? "LUNCH" : "DINNER");
            walkInBooking.setSlotTime(timestamp);
            walkInBooking.setOfferTitle((request.couponCode() != null && !request.couponCode().isBlank()) ? ("Walk-in Deal (" + request.couponCode() + ")") : "Walk-in Direct Payment");
            BigDecimal calcDiscountPct = (billAmount.compareTo(BigDecimal.ZERO) > 0 && discountAmount.compareTo(BigDecimal.ZERO) > 0)
                    ? discountAmount.multiply(BigDecimal.valueOf(100)).divide(billAmount, 1, RoundingMode.HALF_UP)
                    : BigDecimal.ZERO;
            walkInBooking.setDiscountPct(calcDiscountPct);
            walkInBooking.setCoverChargePerGuest(BigDecimal.ZERO);
            walkInBooking.setTotalCoverCharge(BigDecimal.ZERO);
            walkInBooking.setIncludeVipPlan(false);
            walkInBooking.setVipPlanFee(BigDecimal.ZERO);
            walkInBooking.setTotalPaid(totalPaid);
            walkInBooking.setBillAmount(billAmount);
            walkInBooking.setBillAddedAt(Instant.now());
            walkInBooking.setPaymentMethod(request.paymentMethod() != null ? request.paymentMethod() : "Google Pay");
            walkInBooking.setPaymentStatus("PAID");
            walkInBooking.setStatus("COMPLETED");
            walkInBooking.setCoinsEarned(coinsEarned);
            walkInBooking.setSpecialRequests("Direct Walk-in Settlement [Txn: " + txnRef + "]");
            walkInBooking = tableBookingRepository.save(walkInBooking);
            matchedBookingRef = walkInBooking.getBookingRef();
            log.info("Created walk-in dining record {} in table_bookings following direct payment of ₹{}", walkInBooking.getBookingRef(), finalTotalPaid);
        }

        String storeAddress = store.getAddressLine1() != null
                ? store.getAddressLine1()
                : (store.getAddress() != null ? store.getAddress() : "Nagpur Hub");

        log.info("Successfully recorded dining bill payment txnRef={}, totalPaid=₹{}", txnRef, totalPaid);

        return new PayDiningBillResponse(
                txnRef,
                matchedBookingRef,
                store.getId(),
                storeDisplayName,
                storeAddress,
                billAmount,
                discountAmount,
                tipAmount,
                totalPaid,
                coinsEarned,
                request.paymentMethod() != null ? request.paymentMethod() : "Google Pay",
                "SUCCESS",
                timestamp,
                receiptNumber,
                "Dining bill settled successfully at " + storeDisplayName
        );
    }
}
