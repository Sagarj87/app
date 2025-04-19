package com.example.springbootjwtauth.controller;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.context.annotation.Bean;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.ListBucketsRequest;

import java.time.Duration;

@RestController
public class MonitoringController {
    private final MeterRegistry meterRegistry;
    private final Timer customTimer;

    @Autowired
    public MonitoringController(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
        this.customTimer = meterRegistry.timer("custom.endpoint.timer");
    }

    @GetMapping("/api/monitoring/custom-metric")
    public String customMetricEndpoint() {
        return customTimer.record(() -> {
            // Simulate some work
            try { Thread.sleep(100); } catch (InterruptedException ignored) {}
            return "Custom metric recorded!";
        });
    }

    @Bean
    public HealthIndicator s3HealthIndicator() {
        return () -> {
            try {
                S3Client s3 = S3Client.builder()
                        .region(Region.of(System.getenv().getOrDefault("AWS_REGION", "us-east-1")))
                        .credentialsProvider(DefaultCredentialsProvider.create())
                        .build();
                s3.listBuckets(ListBucketsRequest.builder().build());
                return Health.up().withDetail("s3", "Available").build();
            } catch (Exception e) {
                return Health.down(e).withDetail("s3", "Unavailable").build();
            }
        };
    }
}
