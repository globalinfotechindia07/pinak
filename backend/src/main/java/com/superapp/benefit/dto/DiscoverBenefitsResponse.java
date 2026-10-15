package com.superapp.benefit.dto;

import java.util.List;

public record DiscoverBenefitsResponse(
        List<DiscoverBenefitItemDto> benefits
) {}
