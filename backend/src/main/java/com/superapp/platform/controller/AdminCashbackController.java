package com.superapp.platform.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.platform.dto.CashbackSettingDto;
import com.superapp.platform.dto.StoreCashbackDto;
import com.superapp.platform.service.CashbackSettingsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/settings/cashback")
@Tag(name = "Admin Transaction Cashback", description = "Super Admin management of platform and store transaction cashbacks")
@PreAuthorize("hasRole('ADMIN') or hasRole('SUPER_ADMIN')")
public class AdminCashbackController {

    private final CashbackSettingsService cashbackSettingsService;

    public AdminCashbackController(CashbackSettingsService cashbackSettingsService) {
        this.cashbackSettingsService = cashbackSettingsService;
    }

    @GetMapping
    @Operation(summary = "Get global transaction cashback settings", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CashbackSettingDto>> getGlobalCashbackSetting() {
        CashbackSettingDto setting = cashbackSettingsService.getGlobalCashbackSetting();
        return ResponseEntity.ok(ApiResponse.success("Cashback settings fetched successfully", setting));
    }

    @PutMapping
    @Operation(summary = "Update global transaction cashback settings (Super Admin)", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<CashbackSettingDto>> updateGlobalCashbackSetting(
            @Valid @RequestBody CashbackSettingDto request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String updatedBy = userDetails != null ? userDetails.getUsername() : "SUPER_ADMIN";
        CashbackSettingDto updated = cashbackSettingsService.updateGlobalCashbackSetting(request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success("Cashback settings updated successfully", updated));
    }

    @GetMapping("/stores")
    @Operation(summary = "Get all stores with transaction cashback configuration", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<List<StoreCashbackDto>>> getAllStoresCashback() {
        List<StoreCashbackDto> stores = cashbackSettingsService.getAllStoresCashback();
        return ResponseEntity.ok(ApiResponse.success("Stores cashback configuration fetched successfully", stores));
    }

    @GetMapping("/stores/{storeId}")
    @Operation(summary = "Get specific store transaction cashback configuration", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreCashbackDto>> getStoreCashback(@PathVariable UUID storeId) {
        StoreCashbackDto store = cashbackSettingsService.getStoreCashback(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store cashback configuration fetched successfully", store));
    }

    @PutMapping("/stores/{storeId}")
    @Operation(summary = "Update specific store transaction cashback configuration", security = @SecurityRequirement(name = "bearerAuth"))
    public ResponseEntity<ApiResponse<StoreCashbackDto>> updateStoreCashback(
            @PathVariable UUID storeId,
            @Valid @RequestBody StoreCashbackDto request,
            @AuthenticationPrincipal UserDetails userDetails) {

        String updatedBy = userDetails != null ? userDetails.getUsername() : "SUPER_ADMIN";
        StoreCashbackDto updated = cashbackSettingsService.updateStoreCashback(storeId, request, updatedBy);
        return ResponseEntity.ok(ApiResponse.success("Store cashback configuration updated successfully", updated));
    }
}
