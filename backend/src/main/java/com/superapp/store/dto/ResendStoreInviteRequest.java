package com.superapp.store.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ResendStoreInviteRequest(
        String email,
        String managerName,
        String branchName
) {}
