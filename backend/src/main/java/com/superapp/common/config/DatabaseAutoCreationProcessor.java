package com.superapp.common.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanFactoryPostProcessor;
import org.springframework.beans.factory.config.ConfigurableListableBeanFactory;
import org.springframework.context.EnvironmentAware;
import org.springframework.core.Ordered;
import org.springframework.core.PriorityOrdered;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Automatically creates the target PostgreSQL database if it does not already exist.
 * <p>
 * PostgreSQL JDBC does not support the MySQL-style '?createDatabaseIfNotExist=true'
 * parameter directly in the connection URL. This BeanFactoryPostProcessor runs with
 * HIGHEST_PRECEDENCE before HikariCP, Flyway, or Hibernate attempt to connect,
 * ensuring seamless bootstrapping for any developer or deployment.
 */
@Component
public class DatabaseAutoCreationProcessor implements BeanFactoryPostProcessor, EnvironmentAware, PriorityOrdered {

    private static final Logger log = LoggerFactory.getLogger(DatabaseAutoCreationProcessor.class);

    private Environment environment;

    @Override
    public void setEnvironment(Environment environment) {
        this.environment = environment;
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }

    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        if (environment == null) {
            return;
        }

        // Auto-detect and translate cloud DATABASE_URL (postgres:// or postgresql://) to Spring Boot JDBC format
        if (environment instanceof org.springframework.core.env.ConfigurableEnvironment configEnv) {
            String rawUrl = configEnv.getProperty("DATABASE_URL");
            if (rawUrl == null || rawUrl.isBlank()) {
                rawUrl = configEnv.getProperty("spring.datasource.url");
            }
            if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
                try {
                    String cleanUriStr = rawUrl.startsWith("postgres://")
                            ? "postgresql://" + rawUrl.substring("postgres://".length())
                            : rawUrl;
                    URI uri = URI.create(cleanUriStr);
                    String userInfo = uri.getUserInfo();
                    String user = null;
                    String pass = null;
                    if (userInfo != null && userInfo.contains(":")) {
                        String[] parts = userInfo.split(":", 2);
                        user = parts[0];
                        pass = parts[1];
                    }
                    String host = uri.getHost() != null ? uri.getHost() : "localhost";
                    int port = uri.getPort() > 0 ? uri.getPort() : 5432;
                    String path = uri.getPath() != null && !uri.getPath().isBlank() ? uri.getPath() : "/superappdb";
                    String query = uri.getQuery();

                    StringBuilder jdbcUrlBuilder = new StringBuilder("jdbc:postgresql://")
                            .append(host).append(":").append(port).append(path);
                    if (query != null && !query.isBlank()) {
                        jdbcUrlBuilder.append("?").append(query);
                    }

                    java.util.Map<String, Object> cloudProps = new java.util.HashMap<>();
                    cloudProps.put("spring.datasource.url", jdbcUrlBuilder.toString());
                    if (user != null) {
                        cloudProps.put("spring.datasource.username", user);
                    }
                    if (pass != null) {
                        cloudProps.put("spring.datasource.password", pass);
                    }
                    // For managed cloud databases, database instance already exists
                    cloudProps.put("spring.datasource.create-database-if-not-exist", "false");

                    configEnv.getPropertySources().addFirst(
                            new org.springframework.core.env.MapPropertySource("cloudDatabaseProperties", cloudProps));
                    log.info("Detected cloud database URL. Automatically configured JDBC URL: {} for user: {}",
                            jdbcUrlBuilder, user != null ? user : "configured");
                } catch (Exception e) {
                    log.warn("Could not auto-parse cloud DATABASE_URL: {}", e.getMessage());
                }
            }
        }

        boolean shouldCreate = environment.getProperty("spring.datasource.create-database-if-not-exist", Boolean.class, true);
        if (!shouldCreate) {
            return;
        }

        String jdbcUrl = environment.getProperty("spring.datasource.url");
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:postgresql://")) {
            return;
        }

        String username = environment.getProperty("spring.datasource.username", "postgres");
        String password = environment.getProperty("spring.datasource.password", "root");

        createDatabaseIfNotExists(jdbcUrl, username, password);
    }

    private void createDatabaseIfNotExists(String fullJdbcUrl, String username, String password) {
        try {
            // Strip "jdbc:" to parse with URI
            String cleanUriStr = fullJdbcUrl.substring(5); // "postgresql://host:port/database?params"
            URI uri = URI.create(cleanUriStr);

            String path = uri.getPath();
            if (path == null || path.length() <= 1) {
                return;
            }

            // e.g. "/superappdb" -> "superappdb"
            String targetDbName = path.substring(1);
            if (targetDbName.contains("?")) {
                targetDbName = targetDbName.substring(0, targetDbName.indexOf('?'));
            }

            if (targetDbName.isBlank() || "postgres".equalsIgnoreCase(targetDbName) || "template1".equalsIgnoreCase(targetDbName)) {
                return;
            }

            // Validate db name contains only alphanumeric and underscores to prevent SQL injection
            if (!targetDbName.matches("^[a-zA-Z0-9_]+$")) {
                log.warn("Skipping auto database creation: database name '{}' contains non-standard characters.", targetDbName);
                return;
            }

            // Maintenance DB connection URL (connect to default 'postgres' database)
            String host = uri.getHost() != null ? uri.getHost() : "localhost";
            int port = uri.getPort() > 0 ? uri.getPort() : 5432;
            String maintenanceUrl = "jdbc:postgresql://" + host + ":" + port + "/postgres";

            log.info("Verifying existence of target PostgreSQL database '{}' via maintenance connection...", targetDbName);

            try (Connection conn = DriverManager.getConnection(maintenanceUrl, username, password)) {
                boolean dbExists = false;
                try (PreparedStatement checkStmt = conn.prepareStatement("SELECT 1 FROM pg_database WHERE datname = ?")) {
                    checkStmt.setString(1, targetDbName);
                    try (ResultSet rs = checkStmt.executeQuery()) {
                        if (rs.next()) {
                            dbExists = true;
                        }
                    }
                }

                if (!dbExists) {
                    log.info("Target database '{}' does not exist. Creating database now...", targetDbName);
                    // CREATE DATABASE cannot run inside a transaction block or as prepared statement parameter in Postgres
                    try (Statement createStmt = conn.createStatement()) {
                        createStmt.executeUpdate("CREATE DATABASE \"" + targetDbName + "\" WITH ENCODING 'UTF8'");
                        log.info("Target database '{}' created successfully! HikariCP and Flyway can now initialize.", targetDbName);
                    }
                } else {
                    log.debug("Target database '{}' already exists.", targetDbName);
                }
            }
        } catch (Exception e) {
            // Log warning but don't prevent application from attempting connection in case user does not have CREATE DB permission
            log.warn("Automated database creation check encountered notice: {}", e.getMessage());
        }
    }
}
