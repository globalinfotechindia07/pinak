# Spring Boot Authentication & Authorization Service

A production-ready **Authentication and Role-Based Access Control (RBAC)** REST API backend built with Java 21, Spring Boot 3, Spring Security 6, PostgreSQL, Flyway, JJWT, and Log4j2.

---

## Tech Stack

* **Java**: 21
* **Framework**: Spring Boot 3.2.2 (Spring MVC, Spring Data JPA, Spring Security 6)
* **Security & Tokens**: Dual-token JWT (Short-lived Access Token + Long-lived Refresh Token) via JJWT 0.12.5 & BCrypt
* **Database**: PostgreSQL (`jdbc:postgresql://localhost:5433/authdb`)
* **Migration**: Flyway Community Edition
* **Logging**: SLF4J + Apache Log4j2 (Console ANSI color + Rolling File Appender)
* **API Documentation**: Springdoc OpenAPI 3 / Swagger UI
* **Build Tool**: Maven

---

## Features

- **User Authentication**: Registration, Login, and Token Refresh / Rotation.
- **Role-Based Access Control**:
  - `ROLE_USER`: Profile management (`GET /api/v1/users/me`, `PUT /api/v1/users/me`).
  - `ROLE_ADMIN`: Dedicated Admin Panel (`GET /api/v1/admin/dashboard`, `GET /api/v1/admin/users`, `PATCH /api/v1/admin/users/{id}/role`, `DELETE /api/v1/admin/users/{id}`).
- **Dual-Token JWT Security**:
  - 15-minute Access Token (`tokenType: "ACCESS"`).
  - 7-day Refresh Token (`tokenType: "REFRESH"`).
  - Enforced token-type validation preventing refresh tokens on API endpoints.
- **Consistent API Response Envelopes**:
  - `SuccessResponse<T>` (`timestamp`, `status`, `message`, `data`).
  - `ErrorResponse` (`timestamp`, `status`, `error`, `message`, `path`, `validationErrors`).
- **High-Performance Logging**:
  - Log4j2 with console formatting and daily/10MB rolling file logs (`logs/auth-service.log`).
- **PostgreSQL Persistence**:
  - Flyway-managed schema migrations and automatic seeding of default admin (`admin@example.com` / `Admin@123`) and user (`user@example.com` / `User@123`).

---

## Getting Started

### 1. Start PostgreSQL (Port 5433)
```bash
/opt/homebrew/opt/postgresql@14/bin/pg_ctl -D /opt/homebrew/var/postgresql@14 -o "-p 5433" start
```

### 2. Run the Application
```bash
mvn spring-boot:run
```

The server starts on `http://localhost:8080`.

---

## API Documentation

* **Swagger UI (Interactive API Tester)**: [http://localhost:8080/swagger-ui/index.html](http://localhost:8080/swagger-ui/index.html)
* **OpenAPI 3 JSON Docs**: [http://localhost:8080/v3/api-docs](http://localhost:8080/v3/api-docs)

---

## Running Automated Tests

```bash
mvn clean test
```
All 40 unit and integration tests run and pass out of the box.
