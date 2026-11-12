package com.superapp.platform.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Super Admin Welcome Bonus & Signup Coins Configuration")
@JsonIgnoreProperties(ignoreUnknown = true)
public record WelcomeBonusSettingDto(
        @Schema(description = "Whether instant welcome coins are enabled for first-time signups", example = "true")
        Boolean enabled,

        @Schema(description = "Number of PINAK coins to credit to first-time users", example = "100")
        Integer coins,

        @Schema(description = "Coupon code associated with welcome bonus", example = "WELCOME100")
        String couponCode,

        @Schema(description = "Welcome bonus description", example = "Instant Welcome Bonus for first-time mobile signup")
        String description
) {
    public static WelcomeBonusSettingDto defaults() {
        return new WelcomeBonusSettingDto(
                true,
                100,
                "WELCOME100",
                "Instant Welcome Bonus for first-time mobile signup"
        );
    }
}
