package com.superapp.transaction.common;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferType;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Centralized financial calculation engine.
 * Ensures consistent money representation with BigDecimal(12, 2) and HALF_UP rounding.
 */
public final class AmountCalculator {

    public static final String SUPPORTED_CURRENCY = "INR";
    public static final int SCALE = 2;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    private AmountCalculator() {}

    public record CalculationResult(
            BigDecimal grossAmount,
            BigDecimal discountAmount,
            BigDecimal payableAmount
    ) {}

    public static void validateCurrency(String currency) {
        if (currency == null || !SUPPORTED_CURRENCY.equalsIgnoreCase(currency.trim())) {
            throw new AppException("Only " + SUPPORTED_CURRENCY + " currency is supported",
                    ApiError.INVALID_CURRENCY, 400);
        }
    }

    public static CalculationResult calculate(BigDecimal grossAmount, Offer offer) {
        if (grossAmount == null || grossAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new AppException("Gross amount must be greater than zero",
                    ApiError.VALIDATION_FAILED, 400);
        }

        BigDecimal scaledGross = grossAmount.setScale(SCALE, ROUNDING_MODE);

        if (offer == null) {
            BigDecimal zeroDiscount = BigDecimal.ZERO.setScale(SCALE, ROUNDING_MODE);
            return new CalculationResult(scaledGross, zeroDiscount, scaledGross);
        }

        // Validate minimum transaction amount if configured
        if (offer.getMinTransactionAmount() != null &&
                scaledGross.compareTo(offer.getMinTransactionAmount().setScale(SCALE, ROUNDING_MODE)) < 0) {
            throw new AppException("Offer requires a minimum transaction amount of ₹" + offer.getMinTransactionAmount(),
                    ApiError.OFFER_NOT_ELIGIBLE, 409);
        }

        BigDecimal discount = BigDecimal.ZERO.setScale(SCALE, ROUNDING_MODE);

        if (offer.getType() == OfferType.PERCENTAGE_DISCOUNT) {
            BigDecimal percentage = offer.getValue() != null ? offer.getValue() : BigDecimal.ZERO;
            discount = scaledGross.multiply(percentage)
                    .divide(BigDecimal.valueOf(100), SCALE, ROUNDING_MODE);

            if (offer.getMaxDiscountAmount() != null) {
                BigDecimal maxDiscount = offer.getMaxDiscountAmount().setScale(SCALE, ROUNDING_MODE);
                if (discount.compareTo(maxDiscount) > 0) {
                    discount = maxDiscount;
                }
            }
        } else {
            // Flat discount, cashback, etc.
            BigDecimal offerValue = offer.getValue() != null ?
                    offer.getValue().setScale(SCALE, ROUNDING_MODE) : BigDecimal.ZERO.setScale(SCALE, ROUNDING_MODE);
            discount = offerValue.min(scaledGross);
        }

        BigDecimal payable = scaledGross.subtract(discount).setScale(SCALE, ROUNDING_MODE);
        if (payable.compareTo(BigDecimal.ZERO) < 0) {
            payable = BigDecimal.ZERO.setScale(SCALE, ROUNDING_MODE);
            discount = scaledGross;
        }

        return new CalculationResult(scaledGross, discount, payable);
    }
}
