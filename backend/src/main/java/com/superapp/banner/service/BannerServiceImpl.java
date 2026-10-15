package com.superapp.banner.service;

import com.superapp.banner.dto.BannerItemDto;
import com.superapp.banner.dto.BannersResponse;
import com.superapp.mobile.entity.HomeBanner;
import com.superapp.mobile.repository.HomeBannerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Service
public class BannerServiceImpl implements BannerService {

    private final HomeBannerRepository homeBannerRepository;

    public BannerServiceImpl(HomeBannerRepository homeBannerRepository) {
        this.homeBannerRepository = homeBannerRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public BannersResponse getBanners(String placement, Double latitude, Double longitude) {
        // Query real database table home_banners in PostgreSQL
        List<HomeBanner> banners = homeBannerRepository.findAllActiveBanners();
        List<BannerItemDto> items = new ArrayList<>();

        for (HomeBanner b : banners) {
            String idStr = b.getId() != null ? b.getId().toString() : null;
            String actionType = b.getCtaAction() != null ? b.getCtaAction() : "CAMPAIGN";
            String actionId = b.getCtaTargetId() != null ? b.getCtaTargetId() : ("cmp_" + (idStr != null ? idStr.substring(0, 8) : "1001"));
            String deeplink = "pinak://" + actionType.toLowerCase().replace("_", "-") + "/" + actionId;

            String bgColor = switch (b.getThemeStyle() != null ? b.getThemeStyle() : "") {
                case "SECONDARY_GRADIENT" -> "#1E1B4B";
                case "TERTIARY_GRADIENT" -> "#0F172A";
                default -> "#5B21B6";
            };

            String desc = b.getSubtitle() != null ? b.getSubtitle() : "Exclusive PINAK promotional benefits";

            items.add(new BannerItemDto(
                    idStr,
                    b.getTitle(),
                    b.getSubtitle(),
                    desc,
                    b.getImageUrl(),
                    bgColor,
                    b.getBadgeText() != null ? b.getBadgeText().toUpperCase() : "FEATURED",
                    b.getCtaText() != null ? b.getCtaText() : "Claim Pass",
                    actionType,
                    actionId,
                    deeplink,
                    b.getDisplayOrder() != null ? b.getDisplayOrder() : 0,
                    b.getCreatedAt() != null ? b.getCreatedAt() : Instant.now(),
                    b.getCountdownEndTime()
            ));
        }

        return new BannersResponse(items);
    }
}
