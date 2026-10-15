package com.superapp.banner.service;

import com.superapp.banner.dto.BannersResponse;

public interface BannerService {
    BannersResponse getBanners(String placement, Double latitude, Double longitude);
}
