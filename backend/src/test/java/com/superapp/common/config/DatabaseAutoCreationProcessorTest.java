package com.superapp.common.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.Ordered;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseAutoCreationProcessorTest {

    @Test
    @DisplayName("Processor has HIGHEST_PRECEDENCE to run before DataSource initialization")
    void verifyOrderIsHighestPrecedence() {
        DatabaseAutoCreationProcessor processor = new DatabaseAutoCreationProcessor();
        assertThat(processor.getOrder()).isEqualTo(Ordered.HIGHEST_PRECEDENCE);
    }

    @Test
    @DisplayName("Processor skips execution when create-database-if-not-exist is disabled")
    void skipsWhenDisabled() {
        DatabaseAutoCreationProcessor processor = new DatabaseAutoCreationProcessor();
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.datasource.create-database-if-not-exist", "false");
        env.setProperty("spring.datasource.url", "jdbc:postgresql://localhost:5432/testdb");
        processor.setEnvironment(env);

        // Does not throw and skips gracefully
        processor.postProcessBeanFactory(null);
    }

    @Test
    @DisplayName("Processor skips execution when url is not a PostgreSQL URL")
    void skipsWhenNotPostgres() {
        DatabaseAutoCreationProcessor processor = new DatabaseAutoCreationProcessor();
        MockEnvironment env = new MockEnvironment();
        env.setProperty("spring.datasource.create-database-if-not-exist", "true");
        env.setProperty("spring.datasource.url", "jdbc:h2:mem:testdb");
        processor.setEnvironment(env);

        // Does not throw and skips gracefully
        processor.postProcessBeanFactory(null);
    }

    @Test
    @DisplayName("Processor auto-resolves Render internal host and configures external SSL JDBC properties")
    void translatesRenderInternalHostnameToExternalWithSsl() {
        DatabaseAutoCreationProcessor processor = new DatabaseAutoCreationProcessor();
        MockEnvironment env = new MockEnvironment();
        env.setProperty("DATABASE_URL", "postgres://pinak_user:secret@dpg-dbc71o3bc2fs73bh31ug-a/superappdb_w5rc");
        processor.setEnvironment(env);

        processor.postProcessBeanFactory(null);

        String configuredUrl = env.getProperty("spring.datasource.url");
        assertThat(configuredUrl).isNotNull();
        assertThat(configuredUrl).contains("dpg-dbc71o3bc2fs73bh31ug-a.oregon-postgres.render.com:5432/superappdb_w5rc");
        assertThat(configuredUrl).contains("sslmode=require");
        assertThat(env.getProperty("spring.datasource.username")).isEqualTo("pinak_user");
        assertThat(env.getProperty("spring.datasource.password")).isEqualTo("secret");
        assertThat(env.getProperty("spring.datasource.create-database-if-not-exist")).isEqualTo("false");
    }
}
