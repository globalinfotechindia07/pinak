package com.superapp.mobile.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.AdminBannerDtos.BannerDetailResponse;
import com.superapp.mobile.dto.AdminBannerDtos.CreateBannerRequest;
import com.superapp.mobile.dto.AdminBannerDtos.UpdateBannerRequest;
import com.superapp.mobile.service.AdminBannerService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/banners")
@Tag(name = "Admin Banners CMS", description = "Endpoints for Super Admin to curate and manage Mobile Home Hero Banners")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminBannerController {

    private final AdminBannerService adminBannerService;

    public AdminBannerController(AdminBannerService adminBannerService) {
        this.adminBannerService = adminBannerService;
    }

    @GetMapping
    @Operation(summary = "List all promotional hero banners for admin CMS")
    public ResponseEntity<ApiResponse<List<BannerDetailResponse>>> getAllBanners() {
        List<BannerDetailResponse> banners = adminBannerService.getAllBanners();
        return ResponseEntity.ok(ApiResponse.success("Banners fetched successfully", banners));
    }

    @PostMapping
    @Operation(summary = "Create a new hero promotional banner")
    public ResponseEntity<ApiResponse<BannerDetailResponse>> createBanner(
            @Valid @RequestBody CreateBannerRequest request) {
        BannerDetailResponse response = adminBannerService.createBanner(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Banner created successfully", response));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing promotional banner")
    public ResponseEntity<ApiResponse<BannerDetailResponse>> updateBanner(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateBannerRequest request) {
        BannerDetailResponse response = adminBannerService.updateBanner(id, request);
        return ResponseEntity.ok(ApiResponse.success("Banner updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a promotional banner")
    public ResponseEntity<ApiResponse<Void>> deleteBanner(@PathVariable UUID id) {
        adminBannerService.deleteBanner(id);
        return ResponseEntity.ok(ApiResponse.success("Banner deleted successfully", null));
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Toggle banner active / inactive status")
    public ResponseEntity<ApiResponse<BannerDetailResponse>> toggleBannerStatus(@PathVariable UUID id) {
        BannerDetailResponse response = adminBannerService.toggleBannerStatus(id);
        return ResponseEntity.ok(ApiResponse.success("Banner status updated successfully", response));
    }
}
