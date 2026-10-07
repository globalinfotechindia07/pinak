package com.superapp.offer;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.offer.dto.CreateOfferRequest;
import com.superapp.offer.dto.UpdateOfferRequest;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import com.superapp.offer.validation.OfferValidator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class OfferValidatorTest {

    private OfferValidator validator;

    @BeforeEach
    void setUp() {
        validator = new OfferValidator();
    }

    @Test
    @DisplayName("Valid dates pass validation")
    void validDates_pass() {
        Instant from = Instant.now();
        Instant to = from.plus(7, ChronoUnit.DAYS);
        assertDoesNotThrow(() -> validator.validateDates(from, to));
    }

    @Test
    @DisplayName("Invalid dates (validFrom >= validTo) throws INVALID_OFFER_DATES")
    void invalidDates_throwsException() {
        Instant now = Instant.now();
        AppException ex = assertThrows(AppException.class, () -> validator.validateDates(now, now));
        assertEquals(ApiError.INVALID_OFFER_DATES, ex.getErrorCode());
        assertEquals(400, ex.getHttpStatus());

        AppException ex2 = assertThrows(AppException.class,
                () -> validator.validateDates(now.plus(5, ChronoUnit.DAYS), now));
        assertEquals(ApiError.INVALID_OFFER_DATES, ex2.getErrorCode());
    }

    @Test
    @DisplayName("Percentage discount > 100% throws INVALID_OFFER_VALUE")
    void percentageOver100_throwsException() {
        AppException ex = assertThrows(AppException.class,
                () -> validator.validateOfferValues(OfferType.PERCENTAGE_DISCOUNT, BigDecimal.valueOf(100.1), null, null));
        assertEquals(ApiError.INVALID_OFFER_VALUE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Valid percentage discount passes")
    void validPercentage_passes() {
        assertDoesNotThrow(() -> validator.validateOfferValues(OfferType.PERCENTAGE_DISCOUNT, BigDecimal.valueOf(25.0), null, null));
        assertDoesNotThrow(() -> validator.validateOfferValues(OfferType.PERCENTAGE_DISCOUNT, BigDecimal.valueOf(100.0), null, null));
    }

    @Test
    @DisplayName("Fixed discount > minTransactionAmount throws INVALID_OFFER_VALUE")
    void fixedDiscountExceedsMin_throwsException() {
        AppException ex = assertThrows(AppException.class,
                () -> validator.validateOfferValues(OfferType.FIXED_DISCOUNT, BigDecimal.valueOf(500), BigDecimal.valueOf(400), null));
        assertEquals(ApiError.INVALID_OFFER_VALUE, ex.getErrorCode());
    }

    @Test
    @DisplayName("Per-customer limit exceeding usage limit throws VALIDATION_FAILED")
    void perCustomerLimitExceedsUsage_throwsException() {
        AppException ex = assertThrows(AppException.class,
                () -> validator.validateLimits(10, 20));
        assertEquals(ApiError.VALIDATION_FAILED, ex.getErrorCode());
    }

    @Test
    @DisplayName("Submitting expired offer throws INVALID_OFFER_STATE")
    void submitExpiredOffer_throwsException() {
        Offer offer = new Offer();
        offer.setStatus(OfferStatus.EXPIRED);
        offer.setValidFrom(Instant.now().minus(10, ChronoUnit.DAYS));
        offer.setValidTo(Instant.now().minus(2, ChronoUnit.DAYS));

        AppException ex = assertThrows(AppException.class, () -> validator.validateSubmittable(offer));
        assertEquals(ApiError.INVALID_OFFER_STATE, ex.getErrorCode());
        assertEquals(409, ex.getHttpStatus());
    }

    @Test
    @DisplayName("Approving offer not in PENDING_APPROVAL status throws INVALID_OFFER_STATE")
    void approveDraftOffer_throwsException() {
        Offer offer = new Offer();
        offer.setApprovalStatus(OfferApprovalStatus.DRAFT);
        offer.setValidFrom(Instant.now());
        offer.setValidTo(Instant.now().plus(5, ChronoUnit.DAYS));

        AppException ex = assertThrows(AppException.class, () -> validator.validateApprovable(offer));
        assertEquals(ApiError.INVALID_OFFER_STATE, ex.getErrorCode());
    }
}
