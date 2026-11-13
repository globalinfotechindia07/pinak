package com.superapp.coupon.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.superapp.coupon.dto.CouponDtos.*;
import com.superapp.coupon.entity.Coupon;
import com.superapp.coupon.enums.DiscountType;
import com.superapp.coupon.repository.CouponRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.*;

@Service
public class CouponServiceImpl implements CouponService {

    private static final Logger log = LoggerFactory.getLogger(CouponServiceImpl.class);

    private final CouponRepository couponRepository;
    private final ObjectMapper objectMapper;

    public CouponServiceImpl(CouponRepository couponRepository, ObjectMapper objectMapper) {
        this.couponRepository = couponRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    @Transactional(readOnly = true)
    public ApplicableCouponsResponse getApplicableCoupons(UUID storeId, BigDecimal billAmount) {
        Instant now = Instant.now();
        List<Coupon> rawCoupons = couponRepository.findApplicableCoupons(storeId, now);

        BigDecimal effectiveBill = billAmount != null && billAmount.compareTo(BigDecimal.ZERO) > 0
                ? billAmount
                : BigDecimal.ZERO;

        List<CouponItemDto> dtoList = new ArrayList<>();
        CouponItemDto bestAutoCoupon = null;
        BigDecimal highestSavings = BigDecimal.ZERO;

        for (Coupon c : rawCoupons) {
            boolean isEligible = effectiveBill.compareTo(c.getMinBillAmount()) >= 0;
            BigDecimal savings = calculateSavings(c, effectiveBill);

            CouponItemDto dto = mapToDto(c, isEligible, savings);
            dtoList.add(dto);

            if (isEligible && (c.getIsAutoApplicable() || savings.compareTo(highestSavings) > 0)) {
                if (savings.compareTo(highestSavings) >= 0 || bestAutoCoupon == null || c.getIsAutoApplicable()) {
                    bestAutoCoupon = dto;
                    highestSavings = savings;
                }
            }
        }

        return new ApplicableCouponsResponse(
                dtoList.size(),
                bestAutoCoupon,
                dtoList
        );
    }

    @Override
    @Transactional(readOnly = true)
    public ValidateCouponResponse validateCoupon(ValidateCouponRequest request) {
        if (request == null || request.code() == null || request.code().isBlank()) {
            return new ValidateCouponResponse(false, "", "Coupon code cannot be empty.", BigDecimal.ZERO, BigDecimal.ZERO, null);
        }

        String cleanCode = request.code().trim().toUpperCase();
        Optional<Coupon> opt = couponRepository.findByCodeIgnoreCase(cleanCode);

        if (opt.isEmpty()) {
            return new ValidateCouponResponse(false, cleanCode, "Invalid coupon code: " + cleanCode, BigDecimal.ZERO, request.billAmount(), null);
        }

        Coupon c = opt.get();
        if (!Boolean.TRUE.equals(c.getIsActive())) {
            return new ValidateCouponResponse(false, cleanCode, "Coupon " + cleanCode + " is no longer active.", BigDecimal.ZERO, request.billAmount(), null);
        }

        Instant now = Instant.now();
        if (c.getValidFrom() != null && now.isBefore(c.getValidFrom())) {
            return new ValidateCouponResponse(false, cleanCode, "Coupon " + cleanCode + " is not yet valid.", BigDecimal.ZERO, request.billAmount(), null);
        }
        if (c.getValidTo() != null && now.isAfter(c.getValidTo())) {
            return new ValidateCouponResponse(false, cleanCode, "Coupon " + cleanCode + " has expired.", BigDecimal.ZERO, request.billAmount(), null);
        }

        BigDecimal bill = request.billAmount() != null ? request.billAmount() : BigDecimal.ZERO;
        if (bill.compareTo(c.getMinBillAmount()) < 0) {
            return new ValidateCouponResponse(
                    false,
                    cleanCode,
                    "Minimum bill of ₹" + c.getMinBillAmount().stripTrailingZeros().toPlainString() + " required to use " + cleanCode,
                    BigDecimal.ZERO,
                    bill,
                    mapToDto(c, false, BigDecimal.ZERO)
            );
        }

        if (c.getUsageLimitTotal() != null && c.getCurrentUsageCount() >= c.getUsageLimitTotal()) {
            return new ValidateCouponResponse(false, cleanCode, "Coupon " + cleanCode + " usage limit reached.", BigDecimal.ZERO, bill, null);
        }

        BigDecimal discount = calculateSavings(c, bill);
        BigDecimal payable = bill.subtract(discount).max(BigDecimal.ZERO);

        CouponItemDto dto = mapToDto(c, true, discount);
        return new ValidateCouponResponse(
                true,
                cleanCode,
                "Coupon " + cleanCode + " applied! Saved ₹" + discount.stripTrailingZeros().toPlainString(),
                discount,
                payable,
                dto
        );
    }

    @Override
    @Transactional
    public void recordCouponUsage(String code) {
        if (code == null || code.isBlank()) return;
        couponRepository.findByCodeIgnoreCase(code.trim().toUpperCase()).ifPresent(c -> {
            c.setCurrentUsageCount(c.getCurrentUsageCount() + 1);
            couponRepository.save(c);
            log.info("Recorded coupon usage for code={}, new count={}", c.getCode(), c.getCurrentUsageCount());
        });
    }

    private BigDecimal calculateSavings(Coupon c, BigDecimal bill) {
        if (bill == null || bill.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        if (c.getDiscountType() == DiscountType.FLAT) {
            return c.getDiscountValue().min(bill);
        }

        // Percentage discount
        BigDecimal calculated = bill.multiply(c.getDiscountValue())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        if (c.getMaxDiscount() != null && c.getMaxDiscount().compareTo(BigDecimal.ZERO) > 0) {
            return calculated.min(c.getMaxDiscount());
        }

        return calculated.min(bill);
    }

    private CouponItemDto mapToDto(Coupon c, boolean isEligible, BigDecimal savings) {
        List<String> termsList = parseTerms(c.getTerms());

        return new CouponItemDto(
                c.getId(),
                c.getCode(),
                c.getTitle(),
                c.getHeadline(),
                c.getDescription(),
                c.getBadgeText(),
                c.getDiscountType().name(),
                c.getDiscountValue(),
                c.getMaxDiscount(),
                c.getMinBillAmount(),
                c.getPartnerBank(),
                c.getPaymentMethodRequired(),
                termsList,
                Boolean.TRUE.equals(c.getIsAutoApplicable()),
                isEligible,
                savings
        );
    }

    private List<String> parseTerms(String termsJson) {
        if (termsJson == null || termsJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            if (termsJson.trim().startsWith("[")) {
                return objectMapper.readValue(termsJson, new TypeReference<List<String>>() {});
            }
        } catch (Exception e) {
            log.debug("Terms is not JSON array, splitting by line/semicolon");
        }
        String[] split = termsJson.split("[;\n]");
        List<String> list = new ArrayList<>();
        for (String s : split) {
            String trimmed = s.trim();
            if (!trimmed.isBlank()) {
                list.add(trimmed);
            }
        }
        return list;
    }
}
