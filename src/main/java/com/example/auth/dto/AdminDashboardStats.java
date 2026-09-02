package com.example.auth.dto;

import java.util.List;

/**
 * DTO containing summary metrics and recent signups for the Admin Dashboard.
 */
public record AdminDashboardStats(
        long totalUsers,
        long adminCount,
        long standardUserCount,
        List<UserResponse> recentUsers
) {
}
