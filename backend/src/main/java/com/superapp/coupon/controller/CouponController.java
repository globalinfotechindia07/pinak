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

    // ==========================================
    // ADMIN MANAGEMENT ENDPOINTS
    // ==========================================

    @GetMapping({
            "/api/v1/admin/coupons",
            "//api/v1/admin/coupons"
    })
    @Operation(summary = "Admin - List All Coupons & Offers",
               description = "Returns complete listing of all system promo codes, active state, usage metrics, and rules.")
    public ResponseEntity<ApiResponse<java.util.List<AdminCouponDto>>> getAllCoupons() {
        java.util.List<AdminCouponDto> list = couponService.getAllCoupons();
        return ResponseEntity.ok(ApiResponse.success("Coupons retrieved successfully", list));
    }

    @GetMapping({
            "/api/v1/admin/coupons/{id}",
            "//api/v1/admin/coupons/{id}"
    })
    @Operation(summary = "Admin - Get Coupon Details",
               description = "Returns full details for a single coupon ID.")
    public ResponseEntity<ApiResponse<AdminCouponDto>> getCouponById(@PathVariable UUID id) {
        AdminCouponDto dto = couponService.getCouponById(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon retrieved successfully", dto));
    }

    @PostMapping({
            "/api/v1/admin/coupons",
            "//api/v1/admin/coupons"
    })
    @Operation(summary = "Admin - Create Coupon",
               description = "Creates a new coupon code with discounts, bank partners, and eligibility limits.")
    public ResponseEntity<ApiResponse<AdminCouponDto>> createCoupon(@Valid @RequestBody SaveCouponRequest request) {
        AdminCouponDto created = couponService.createCoupon(request);
        return ResponseEntity.ok(ApiResponse.success("Coupon created successfully", created));
    }

    @PutMapping({
            "/api/v1/admin/coupons/{id}",
            "//api/v1/admin/coupons/{id}"
    })
    @Operation(summary = "Admin - Update Coupon",
               description = "Updates an existing coupon's terms, discounts, or limits.")
    public ResponseEntity<ApiResponse<AdminCouponDto>> updateCoupon(
            @PathVariable UUID id,
            @Valid @RequestBody SaveCouponRequest request
    ) {
        AdminCouponDto updated = couponService.updateCoupon(id, request);
        return ResponseEntity.ok(ApiResponse.success("Coupon updated successfully", updated));
    }

    @PatchMapping({
            "/api/v1/admin/coupons/{id}/status",
            "//api/v1/admin/coupons/{id}/status"
    })
    @Operation(summary = "Admin - Toggle Coupon Status",
               description = "Enables or disables a coupon code without deleting it.")
    public ResponseEntity<ApiResponse<AdminCouponDto>> toggleStatus(
            @PathVariable UUID id,
            @RequestParam boolean active
    ) {
        AdminCouponDto updated = couponService.toggleActive(id, active);
        return ResponseEntity.ok(ApiResponse.success("Coupon status updated to " + (active ? "ACTIVE" : "INACTIVE"), updated));
    }

    @DeleteMapping({
            "/api/v1/admin/coupons/{id}",
            "//api/v1/admin/coupons/{id}"
    })
    @Operation(summary = "Admin - Delete Coupon",
               description = "Permanently removes a coupon from the system.")
    public ResponseEntity<ApiResponse<Void>> deleteCoupon(@PathVariable UUID id) {
        couponService.deleteCoupon(id);
        return ResponseEntity.ok(ApiResponse.success("Coupon deleted successfully", null));
    }
}
