package com.superapp.mobile.dto;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Security and battery privacy shield guarantee")
public record PrivacyShieldDto(
        @Schema(description = "Whether location data is cryptographically encrypted", example = "true")
        boolean encryptsLocationData,

        @Schema(description = "Whether location data is sold or shared with 3rd parties", example = "false")
        boolean sharesWithThirdParties,

        @Schema(description = "Regulatory compliance badge note", example = "NPCI & RBI compliance grade encryption")
        String complianceNote
) {}
