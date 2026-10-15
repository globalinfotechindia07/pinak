package com.superapp.benefit.dto;

import java.util.List;

public record DiscoverBenefitItemDto(
        String benefitId,
        String title,
        String subtitle,
        String iconName,
        Integer displayOrder
) {}
