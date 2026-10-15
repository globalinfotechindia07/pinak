package com.superapp.banner.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;

@Schema(description = "Promotional banner carousel response")
@JsonInclude(JsonInclude.Include.NON_NULL)
public record BannersResponse(
        @Schema(description = "List of active promotional banners")
        List<BannerItemDto> banners
) {
}
