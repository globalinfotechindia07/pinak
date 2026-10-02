package com.superapp.user.mapper;

import com.superapp.user.dto.UserDTO;
import com.superapp.user.entity.User;
import org.springframework.stereotype.Component;

/**
 * Mapper for converting User entities to safe external DTO representations.
 * Ensures JPA entities are never leaked beyond the service/controller boundary.
 */
@Component
public class UserMapper {

    /**
     * Maps a User entity to a safe UserDTO.Response representation.
     *
     * @param user User entity
     * @return UserDTO.Response
     */
    public UserDTO.Response toResponse(User user) {
        if (user == null) {
            return null;
        }
        return UserDTO.Response.from(user);
    }
}
