package com.superapp.offer.validation;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.offer.dto.CreateOfferRequest;
import com.superapp.offer.dto.UpdateOfferRequest;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferApprovalStatus;
import com.superapp.offer.enums.OfferStatus;
import com.superapp.offer.enums.OfferType;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

@Component
public class OfferValidator {

    private static final BigDecimal MAX_PERCENTAGE = BigDecimal.valueOf(100.0);
    private static final BigDecimal MIN_VALUE = BigDecimal.valueOf(0.01);

    public void validateCreateRequest(CreateOfferRequest request) {
        validateDates(request.validFrom(), request.validTo());
        validateOfferValues(
                request.offerType(),
                request.value(),
                request.minTransactionAmount(),
                request.maxDiscountAmount()
        );
        validateLimits(request.usageLimit(), request.perCustomerLimit());
    }

    public void validateUpdateRequest(UpdateOfferRequest request) {
        validateDates(request.validFrom(), request.validTo());
        validateOfferValues(
                request.offerType(),
                request.value(),
                request.minTransactionAmount(),
                request.maxDiscountAmount()
        );
        validateLimits(request.usageLimit(), request.perCustomerLimit());
    }

    public void validateDates(Instant validFrom, Instant validTo) {
        if (validFrom == null || validTo == null) {
            throw new AppException("Invalid offer validity period", ApiError.INVALID_OFFER_DATES, 400,
                    List.of(Map.of("field", "validDates", "message", "validFrom and validTo are required")));
        }

        if (!validFrom.isBefore(validTo)) {
            throw new AppException("Invalid offer validity period", ApiError.INVALID_OFFER_DATES, 400,
                    List.of(Map.of("field", "validTo", "message", "validTo must be after validFrom")));
        }
    }

    public void validateOfferValues(
            OfferType type,
            BigDecimal value,
            BigDecimal minTransactionAmount,
            BigDecimal maxDiscountAmount) {

        if (type == null) {
            throw new AppException("Offer type is required", ApiError.INVALID_OFFER_TYPE, 400);
        }

        if (value == null || value.compareTo(MIN_VALUE) < 0) {
            throw new AppException("Offer value must be greater than 0", ApiError.INVALID_OFFER_VALUE, 400);
        }

        if (type == OfferType.PERCENTAGE_DISCOUNT) {
            if (value.compareTo(MAX_PERCENTAGE) > 0) {
                throw new AppException("Percentage discount value cannot exceed 100%", ApiError.INVALID_OFFER_VALUE, 400);
            }
        }

        if (type == OfferType.FIXED_DISCOUNT) {
            if (minTransactionAmount != null && value.compareTo(minTransactionAmount) > 0) {
                throw new AppException("Fixed discount cannot exceed minimum transaction amount",
                        ApiError.INVALID_OFFER_VALUE, 400);
            }
        }
    }

    public void validateLimits(Integer usageLimit, Integer perCustomerLimit) {
        if (usageLimit != null && usageLimit <= 0) {
            throw new AppException("Usage limit must be greater than 0", ApiError.VALIDATION_FAILED, 400);
        }

        if (perCustomerLimit != null && perCustomerLimit <= 0) {
            throw new AppException("Per-customer limit must be greater than 0", ApiError.VALIDATION_FAILED, 400);
        }

        if (usageLimit != null && perCustomerLimit != null && perCustomerLimit > usageLimit) {
            throw new AppException("Per-customer limit cannot exceed total usage limit", ApiError.VALIDATION_FAILED, 400);
        }
    }

    public void validateSubmittable(Offer offer) {
        if (offer.getStatus() == OfferStatus.EXPIRED || offer.isExpired()) {
            throw new AppException("Offer has expired and cannot be submitted", ApiError.INVALID_OFFER_STATE, 409);
        }

        if (offer.getStatus() == OfferStatus.DEACTIVATED) {
            throw new AppException("Deactivated offer cannot be submitted", ApiError.INVALID_OFFER_STATE, 409);
        }

        if (offer.getApprovalStatus() == OfferApprovalStatus.PENDING_APPROVAL) {
            throw new AppException("Offer is already pending approval", ApiError.INVALID_OFFER_STATE, 409);
        }
    }

    public void validateModifiable(Offer offer) {
        if (offer.getStatus() == OfferStatus.EXPIRED || offer.isExpired()) {
            throw new AppException("Offer cannot be modified in its current state", ApiError.INVALID_OFFER_STATE, 409);
        }

        if (offer.getStatus() == OfferStatus.DEACTIVATED) {
            throw new AppException("Offer cannot be modified in its current state", ApiError.INVALID_OFFER_STATE, 409);
        }
    }

    public void validateApprovable(Offer offer) {
        if (offer.getApprovalStatus() != OfferApprovalStatus.PENDING_APPROVAL) {
            throw new AppException("Only offers in PENDING_APPROVAL status can be approved", ApiError.INVALID_OFFER_STATE, 409);
        }

        if (offer.isExpired()) {
            throw new AppException("Cannot approve an expired offer", ApiError.INVALID_OFFER_STATE, 409);
        }
    }

    public void validateRejectable(Offer offer) {
        if (offer.getApprovalStatus() != OfferApprovalStatus.PENDING_APPROVAL) {
            throw new AppException("Only offers in PENDING_APPROVAL status can be rejected", ApiError.INVALID_OFFER_STATE, 409);
        }
    }
}
