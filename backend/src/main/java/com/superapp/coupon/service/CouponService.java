package com.superapp.coupon.service;

import com.superapp.coupon.dto.CouponDtos.*;

import java.math.BigDecimal;
import java.util.UUID;

public interface CouponService {
    ApplicableCouponsResponse getApplicableCoupons(UUID storeId, BigDecimal billAmount);
    ValidateCouponResponse validateCoupon(ValidateCouponRequest request);
    void recordCouponUsage(String code);
}
