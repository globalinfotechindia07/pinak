package com.superapp.mobile.service;

import com.superapp.common.exception.ResourceNotFoundException;
import com.superapp.common.response.ApiError;
import com.superapp.mobile.dto.AdminBannerDtos.BannerDetailResponse;
import com.superapp.mobile.dto.AdminBannerDtos.CreateBannerRequest;
import com.superapp.mobile.dto.AdminBannerDtos.UpdateBannerRequest;
import com.superapp.mobile.entity.HomeBanner;
import com.superapp.mobile.repository.HomeBannerRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AdminBannerServiceImpl implements AdminBannerService {

    private final HomeBannerRepository homeBannerRepository;

    public AdminBannerServiceImpl(HomeBannerRepository homeBannerRepository) {
        this.homeBannerRepository = homeBannerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public List<BannerDetailResponse> getAllBanners() {
        return homeBannerRepository.findAll(Sort.by(Sort.Direction.ASC, "displayOrder"))
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public BannerDetailResponse createBanner(CreateBannerRequest request) {
        HomeBanner banner = new HomeBanner();
        banner.setTitle(request.title().trim());
        banner.setSubtitle(request.subtitle() != null ? request.subtitle().trim() : null);
        banner.setBadgeText(request.badgeText().trim());
        banner.setImageUrl(request.imageUrl());
        banner.setCtaText(request.ctaText() != null ? request.ctaText() : "Claim Pass");
        banner.setCtaAction(request.ctaAction() != null ? request.ctaAction() : "CLAIM_PASS");
        banner.setCtaTargetId(request.ctaTargetId());
        banner.setThemeStyle(request.themeStyle() != null ? request.themeStyle() : "PRIMARY_GRADIENT");
        banner.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : 0);
        banner.setCountdownEndTime(request.countdownEndTime());
        banner.setIsActive(request.isActive() != null ? request.isActive() : true);

        HomeBanner saved = homeBannerRepository.save(banner);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public BannerDetailResponse updateBanner(UUID id, UpdateBannerRequest request) {
        HomeBanner banner = homeBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with ID: " + id, ApiError.RESOURCE_NOT_FOUND));

        banner.setTitle(request.title().trim());
        banner.setSubtitle(request.subtitle() != null ? request.subtitle().trim() : null);
        banner.setBadgeText(request.badgeText().trim());
        banner.setImageUrl(request.imageUrl());
        if (request.ctaText() != null) banner.setCtaText(request.ctaText());
        if (request.ctaAction() != null) banner.setCtaAction(request.ctaAction());
        banner.setCtaTargetId(request.ctaTargetId());
        if (request.themeStyle() != null) banner.setThemeStyle(request.themeStyle());
        if (request.displayOrder() != null) banner.setDisplayOrder(request.displayOrder());
        banner.setCountdownEndTime(request.countdownEndTime());
        if (request.isActive() != null) banner.setIsActive(request.isActive());
        banner.setUpdatedAt(Instant.now());

        HomeBanner saved = homeBannerRepository.save(banner);
        return toResponse(saved);
    }

    @Override
    @Transactional
    public void deleteBanner(UUID id) {
        if (!homeBannerRepository.existsById(id)) {
            throw new ResourceNotFoundException("Banner not found with ID: " + id, ApiError.RESOURCE_NOT_FOUND);
        }
        homeBannerRepository.deleteById(id);
    }

    @Override
    @Transactional
    public BannerDetailResponse toggleBannerStatus(UUID id) {
        HomeBanner banner = homeBannerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Banner not found with ID: " + id, ApiError.RESOURCE_NOT_FOUND));

        banner.setIsActive(!Boolean.TRUE.equals(banner.getIsActive()));
        banner.setUpdatedAt(Instant.now());
        HomeBanner saved = homeBannerRepository.save(banner);
        return toResponse(saved);
    }

    private BannerDetailResponse toResponse(HomeBanner b) {
        return new BannerDetailResponse(
                b.getId(),
                b.getTitle(),
                b.getSubtitle(),
                b.getBadgeText(),
                b.getImageUrl(),
                b.getCtaText(),
                b.getCtaAction(),
                b.getCtaTargetId(),
                b.getThemeStyle(),
                b.getDisplayOrder(),
                b.getCountdownEndTime(),
                b.getIsActive(),
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }
}
