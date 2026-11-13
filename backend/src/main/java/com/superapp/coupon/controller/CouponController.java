package com.superapp.coupon.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.coupon.dto.CouponDtos.*;
import com.superapp.coupon.service.CouponService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.UUID;

@RestController
@Tag(name = "Coupons & Payment Offers", description = "Production APIs for fetching applicable coupons, promo codes, and validating discounts")
public class CouponController {

    private final CouponService couponService;

    public CouponController(CouponService couponService) {
        this.couponService = couponService;
    }

    @GetMapping({
            "/api/v1/coupons/applicable",
            "//api/v1/coupons/applicable",
            "/api/v1/mobile/coupons/applicable",
            "//api/v1/mobile/coupons/applicable"
    })
    @Operation(summary = "Get Applicable Coupons & Payment Offers",
               description = "Returns active platform and store coupons, calculates eligibility for the bill amount, and identifies auto-applicable offers.")
    public ResponseEntity<ApiResponse<ApplicableCouponsResponse>> getApplicableCoupons(
            @RequestParam(required = false) @Parameter(description = "Optional Store Outlet UUID", example = "8e91aefa-dfb2-4f19-b4f6-907e82baf6a5") UUID storeId,
            @RequestParam(required = false) @Parameter(description = "Current Cart / Bill Amount in INR", example = "1500") BigDecimal billAmount
    ) {
        ApplicableCouponsResponse response = couponService.getApplicableCoupons(storeId, billAmount);
        return ResponseEntity.ok(ApiResponse.success("Applicable coupons fetched successfully", response));
    }

    @PostMapping({
            "/api/v1/coupons/validate",
            "//api/v1/coupons/validate",
            "/api/v1/mobile/coupons/validate",
            "//api/v1/mobile/coupons/validate"
    })
    @Operation(summary = "Validate & Calculate Coupon Discount",
               description = "Validates a promo code against the database, checks minimum spend & usage rules, and returns calculated savings.")
    public ResponseEntity<ApiResponse<ValidateCouponResponse>> validateCoupon(
            @Valid @RequestBody ValidateCouponRequest request
    ) {
        ValidateCouponResponse response = couponService.validateCoupon(request);
        return ResponseEntity.ok(ApiResponse.success(response.message(), response));
    }
}
