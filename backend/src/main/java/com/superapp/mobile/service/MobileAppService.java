package com.superapp.mobile.service;

import com.superapp.category.dto.CategoryResponse;
import com.superapp.mobile.dto.MobileDtos.*;

import java.util.List;

/**
 * Core application service for mobile screens (categories, radar preview, permissions).
 */
public interface MobileAppService {

    List<CategoryResponse> getMobileCategories();

    RadarPreviewResponse getRadarPreview(Double latitude, Double longitude);

    UpdatePermissionsResponse updatePermissions(UpdatePermissionsRequest request, String authHeader);
}
