package com.superapp.user.controller;

import com.superapp.common.response.ApiResponse;
import com.superapp.user.dto.UserDTO;
import com.superapp.user.service.AdminDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@Tag(name = "Admin Dashboard", description = "Operational metrics and platform summary for administrators")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
public class AdminDashboardController {

    private final AdminDashboardService adminDashboardService;

    public AdminDashboardController(AdminDashboardService adminDashboardService) {
        this.adminDashboardService = adminDashboardService;
    }

    @GetMapping
    @Operation(summary = "Get platform operational dashboard summary metrics")
    public ResponseEntity<ApiResponse<UserDTO.AdminDashboardSummaryResponse>> getDashboardSummary() {
        UserDTO.AdminDashboardSummaryResponse summary = adminDashboardService.getDashboardSummary();
        return ResponseEntity.ok(ApiResponse.success("Dashboard summary fetched successfully", summary));
    }
}
