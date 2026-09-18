# ==============================================================
# Stage 1: Build JAR using Maven and Eclipse Temurin JDK 21
# ==============================================================
FROM maven:3.9.8-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache Maven dependencies layer
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy application source code and package executable JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# ==============================================================
# Stage 2: Minimal, secure runtime image using Eclipse Temurin JRE 21
# ==============================================================
FROM eclipse-temurin:21-jre-alpine AS runner

# Create unprivileged application user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Copy executable JAR from builder stage
COPY --from=builder --chown=appuser:appgroup /build/target/superapp-*.jar app.jar

# Create logs directory with proper ownership
RUN mkdir -p /app/logs && chown -R appuser:appgroup /app/logs

# Switch to non-root user
USER appuser:appgroup

# Environment defaults (Render overrides PORT at runtime)
ENV PORT=8080 \
    SERVER_ADDRESS=0.0.0.0 \
    JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:+UseG1GC -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

EXPOSE 8080

# Health check using Spring Boot Actuator endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=45s --retries=3 \
    CMD wget -qO- http://127.0.0.1:${PORT:-8080}/actuator/health | grep -q "UP" || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
