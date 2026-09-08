package com.superapp.user.dto;

import com.superapp.user.entity.UserStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateUserStatusRequest(
        @NotNull(message = "Status is required")
        UserStatus status
) {}
