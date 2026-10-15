package com.superapp.banner.controller;

import com.superapp.banner.dto.BannersResponse;
import com.superapp.banner.service.BannerService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/banners")
@Tag(name = "Promotional Banners", description = "Hero promotional banner carousel for Discover and Home screens")
public class BannerController {

    private final BannerService bannerService;

    public BannerController(BannerService bannerService) {
        this.bannerService = bannerService;
    }

    @GetMapping
    @Operation(summary = "Get promotional banners",
               description = "Fetches active promotional hero carousel banners backed by PostgreSQL home_banners table")
    public ResponseEntity<ApiResponse<BannersResponse>> getBanners(
            @Parameter(description = "Screen placement identifier (e.g. DISCOVER, HOME)", example = "DISCOVER")
            @RequestParam(required = false, defaultValue = "DISCOVER") String placement,

            @Parameter(description = "Customer latitude", example = "12.9716")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "Customer longitude", example = "77.6412")
            @RequestParam(required = false) Double longitude) {

        BannersResponse response = bannerService.getBanners(placement, latitude, longitude);
        return ResponseEntity.ok(ApiResponse.success("Banners fetched successfully", response));
    }
}
