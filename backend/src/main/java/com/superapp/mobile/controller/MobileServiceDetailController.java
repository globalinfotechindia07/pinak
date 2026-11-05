package com.superapp.mobile.controller;

import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiResponse;
import com.superapp.mobile.dto.MobileServiceDetailDto;
import com.superapp.mobile.service.MobileServiceDetailService;
import com.superapp.store.entity.Store;
import com.superapp.store.repository.StoreRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@Tag(name = "Mobile App - Service & Store Detail (Screen 11)",
     description = "Comprehensive store/service card click detail view API matching code.html specification")
public class MobileServiceDetailController {

    private final MobileServiceDetailService serviceDetailService;
    private final StoreRepository storeRepository;

    public MobileServiceDetailController(MobileServiceDetailService serviceDetailService, StoreRepository storeRepository) {
        this.serviceDetailService = serviceDetailService;
        this.storeRepository = storeRepository;
    }

    @GetMapping({
            "/api/v1/mobile/stores/{storeId}/detail",
            "/api/v1/mobile/stores/detail",
            "//api/v1/mobile/stores/detail",
            "/api/v1/mobile/services/{storeId}/detail",
            "/api/v1/mobile/services/detail",
            "//api/v1/mobile/services/detail",
            "/api/v1/discovery/stores/{storeId}/detail",
            "/api/v1/discovery/stores/detail"
    })
    @Operation(
            summary = "Fetch Mobile Store / Service Detail View (Screen 11)",
            description = "Returns the comprehensive store detail view payload when user clicks on a service card from the home or discovery feed. " +
                    "Includes Hero with 19 photos, 2X Coin incentive banner, sticky tabs, active pre-booking and walk-in offers, " +
                    "flash sale deals, menu highlights, photo mosaic, verified amenities, GPS location, concierge support, similar places, and sticky bottom bar."
    )
    public ResponseEntity<ApiResponse<MobileServiceDetailDto>> getStoreServiceDetail(
            @PathVariable(required = false) @Parameter(description = "Store Outlet UUID", example = "9fd49f6a-782e-447e-a2ec-db66fec40927") String storeId,
            @RequestParam(required = false) @Parameter(description = "Optional store ID query parameter") String storeIdQuery,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude (short)", example = "21.1458") Double lat,
            @RequestParam(required = false) @Parameter(description = "Customer Device Latitude", example = "21.1458") Double latitude,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude (short)", example = "79.0882") Double lng,
            @RequestParam(required = false) @Parameter(description = "Customer Device Longitude", example = "79.0882") Double longitude
    ) {
        Double effectiveLat = lat != null ? lat : latitude;
        Double effectiveLng = lng != null ? lng : longitude;

        String idCandidate = (storeId != null && !storeId.isBlank() && !"detail".equalsIgnoreCase(storeId) && !"undefined".equalsIgnoreCase(storeId) && !"null".equalsIgnoreCase(storeId))
                ? storeId
                : storeIdQuery;

        UUID effectiveId = null;
        if (idCandidate != null && !idCandidate.isBlank()) {
            try {
                effectiveId = UUID.fromString(idCandidate.trim());
            } catch (IllegalArgumentException ignored) {}
        }

        if (effectiveId == null) {
            if (effectiveLat != null && effectiveLng != null) {
                Page<Store> nearby = storeRepository.findNearbyApprovedStores(effectiveLat, effectiveLng, 50000.0, PageRequest.of(0, 1));
                if (!nearby.isEmpty()) {
                    effectiveId = nearby.getContent().get(0).getId();
                }
            }
            if (effectiveId == null) {
                List<Store> anyStores = storeRepository.findAll();
                if (!anyStores.isEmpty()) {
                    effectiveId = anyStores.get(0).getId();
                }
            }
        }

        if (effectiveId == null) {
            throw new ResourceNotFoundException("No stores available to display detail view");
        }

        MobileServiceDetailDto response = serviceDetailService.getServiceDetail(effectiveId, effectiveLat, effectiveLng);
        return ResponseEntity.ok(ApiResponse.success("Store service detail fetched successfully", response));
    }
}
