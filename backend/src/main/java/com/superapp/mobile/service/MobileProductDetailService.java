package com.superapp.mobile.service;

import com.superapp.mobile.dto.MobileProductDetailDto;
import java.util.UUID;

public interface MobileProductDetailService {
    MobileProductDetailDto getProductDetail(UUID productId, Double lat, Double lng);
}
