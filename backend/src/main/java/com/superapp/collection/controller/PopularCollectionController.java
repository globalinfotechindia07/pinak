package com.superapp.collection.controller;

import com.superapp.collection.dto.PopularCollectionsResponse;
import com.superapp.collection.service.PopularCollectionService;
import com.superapp.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/collections")
@Tag(name = "Popular Collections", description = "Curated collections for the Discover screen")
public class PopularCollectionController {

    private final PopularCollectionService collectionService;

    public PopularCollectionController(PopularCollectionService collectionService) {
        this.collectionService = collectionService;
    }

    @GetMapping("/popular")
    @Operation(summary = "Get popular product and store collections", security = @SecurityRequirement(name = "bearerAuth"))
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PopularCollectionsResponse>> getPopularCollections(
            @RequestParam(required = false, defaultValue = "10") Integer limit,
            @RequestParam(required = false) String cursor) {

        PopularCollectionsResponse response = collectionService.getPopularCollections(limit, cursor);
        return ResponseEntity.ok(ApiResponse.success("Popular collections fetched successfully", response));
    }
}
