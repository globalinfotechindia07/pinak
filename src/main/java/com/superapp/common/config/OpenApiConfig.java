package com.superapp.common.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * Springdoc OpenAPI 3 configuration.
 * Adds Bearer JWT authentication to Swagger UI.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI openAPI() {
        final String securitySchemeName = "bearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("SuperApp — Discount & Rewards API")
                        .description("""
                                Secure REST API foundation for the Discount & Rewards Super-App.
                                
                                **Authentication**: Use `POST /api/v1/auth/login` to obtain a Bearer token,
                                then click the 🔒 Authorize button above and enter: `Bearer <your-access-token>`
                                
                                **Roles**: SUPER_ADMIN | VENDOR | CUSTOMER
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("SuperApp API Team")
                                .email("api@superapp.com"))
                        .license(new License().name("Proprietary")))
                .servers(List.of(
                        new Server().url("http://localhost:8080").description("Local development")
                ))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("JWT Access Token. Format: `Bearer <token>`")));
    }
}
