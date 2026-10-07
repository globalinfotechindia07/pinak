package com.superapp.user.service;
 
import com.superapp.user.dto.UserDTO;

public interface AdminDashboardService {
    UserDTO.AdminDashboardSummaryResponse getDashboardSummary();
}
