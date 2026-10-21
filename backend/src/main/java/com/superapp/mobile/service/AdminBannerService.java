package com.superapp.mobile.service;

import com.superapp.mobile.dto.AdminBannerDtos.BannerDetailResponse;
import com.superapp.mobile.dto.AdminBannerDtos.CreateBannerRequest;
import com.superapp.mobile.dto.AdminBannerDtos.UpdateBannerRequest;

import java.util.List;
import java.util.UUID;

public interface AdminBannerService {
    List<BannerDetailResponse> getAllBanners();
    BannerDetailResponse createBanner(CreateBannerRequest request);
    BannerDetailResponse updateBanner(UUID id, UpdateBannerRequest request);
    void deleteBanner(UUID id);
    BannerDetailResponse toggleBannerStatus(UUID id);
}
