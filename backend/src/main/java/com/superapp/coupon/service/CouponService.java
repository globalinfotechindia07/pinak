package com.superapp.coupon.service;

import com.superapp.coupon.dto.CouponDtos.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface CouponService {
    ApplicableCouponsResponse getApplicableCoupons(UUID storeId, BigDecimal billAmount);
    ValidateCouponResponse validateCoupon(ValidateCouponRequest request);
    void recordCouponUsage(String code);

    List<AdminCouponDto> getAllCoupons();
    AdminCouponDto getCouponById(UUID id);
    AdminCouponDto createCoupon(SaveCouponRequest request);
    AdminCouponDto updateCoupon(UUID id, SaveCouponRequest request);
    AdminCouponDto toggleActive(UUID id, boolean active);
    void deleteCoupon(UUID id);
}
