package com.superapp.mobile.service;

import com.superapp.mobile.dto.RadarPreviewResponse;
import com.superapp.mobile.dto.UpdatePermissionsRequest;
import com.superapp.mobile.dto.UpdatePermissionsResponse;

public interface MobileLocationConsentService {

    RadarPreviewResponse getRadarPreview(Double latitude, Double longitude);

    UpdatePermissionsResponse updatePermissions(UpdatePermissionsRequest request, String authHeader);
}
