package com.superapp.transaction.common;

import com.superapp.common.exception.AppException;
import com.superapp.common.response.ApiError;
import com.superapp.offer.entity.Offer;
import com.superapp.offer.enums.OfferType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AmountCalculatorTest {

    @Test
    @DisplayName("Currency validation accepts INR and rejects other currencies")
    void testCurrencyValidation() {
        AmountCalculator.validateCurrency("INR");
        AmountCalculator.validateCurrency("inr");

        assertThatThrownBy(() -> AmountCalculator.validateCurrency("USD"))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.INVALID_CURRENCY);

        assertThatThrownBy(() -> AmountCalculator.validateCurrency(null))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.INVALID_CURRENCY);
    }

    @Test
    @DisplayName("Calculation without offer returns zero discount and full payable amount")
    void testCalculateWithoutOffer() {
        var result = AmountCalculator.calculate(new BigDecimal("5000.00"), null);

        assertThat(result.grossAmount()).isEqualByComparingTo("5000.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("0.00");
        assertThat(result.payableAmount()).isEqualByComparingTo("5000.00");
    }

    @Test
    @DisplayName("Percentage discount calculates properly and caps at maxDiscountAmount")
    void testCalculatePercentageDiscountCapped() {
        Offer offer = new Offer();
        offer.setType(OfferType.PERCENTAGE_DISCOUNT);
        offer.setValue(new BigDecimal("10.00")); // 10%
        offer.setMaxDiscountAmount(new BigDecimal("300.00")); // max ₹300

        // ₹5000 with 10% = ₹500, capped at ₹300
        var result = AmountCalculator.calculate(new BigDecimal("5000.00"), offer);

        assertThat(result.grossAmount()).isEqualByComparingTo("5000.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("300.00");
        assertThat(result.payableAmount()).isEqualByComparingTo("4700.00");
    }

    @Test
    @DisplayName("Fixed discount subtracts correctly")
    void testCalculateFixedDiscount() {
        Offer offer = new Offer();
        offer.setType(OfferType.FIXED_DISCOUNT);
        offer.setValue(new BigDecimal("500.00"));

        var result = AmountCalculator.calculate(new BigDecimal("5000.00"), offer);

        assertThat(result.grossAmount()).isEqualByComparingTo("5000.00");
        assertThat(result.discountAmount()).isEqualByComparingTo("500.00");
        assertThat(result.payableAmount()).isEqualByComparingTo("4500.00");
    }

    @Test
    @DisplayName("Rejects calculation when grossAmount is below offer minTransactionAmount")
    void testMinTransactionAmountViolation() {
        Offer offer = new Offer();
        offer.setType(OfferType.PERCENTAGE_DISCOUNT);
        offer.setValue(new BigDecimal("10.00"));
        offer.setMinTransactionAmount(new BigDecimal("1000.00"));

        assertThatThrownBy(() -> AmountCalculator.calculate(new BigDecimal("500.00"), offer))
                .isInstanceOf(AppException.class)
                .matches(e -> ((AppException) e).getErrorCode() == ApiError.OFFER_NOT_ELIGIBLE);
    }
}
