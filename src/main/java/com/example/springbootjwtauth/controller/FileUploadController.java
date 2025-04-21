package com.example.springbootjwtauth.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.auth.credentials.DefaultCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import java.net.URI;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import com.example.springbootjwtauth.service.S3Service;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {
    @Value("${aws.s3.bucket}")
    private String bucketName;

    @Value("${app.file-upload.max-size-bytes:1048576}")
    private long maxFileSize;

    private static final List<String> ALLOWED_TYPES = List.of(
            "application/pdf",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg",
            "image/png"
    );

    private static final Logger logger = LoggerFactory.getLogger(FileUploadController.class);

    private final S3Service s3Service;

    @Autowired
    public FileUploadController(S3Service s3Service) {
        this.s3Service = s3Service;
    }

    @PostMapping("/upload")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            logger.info("Received file upload request: name={}, size={}, type={}", file.getOriginalFilename(), file.getSize(), file.getContentType());
            if (!ALLOWED_TYPES.contains(file.getContentType())) {
                logger.warn("Rejected file type: {}", file.getContentType());
                return ResponseEntity.badRequest().body("File type not allowed");
            }
            if (file.getSize() > maxFileSize) {
                logger.warn("Rejected file size: {} bytes (limit: {} bytes)", file.getSize(), maxFileSize);
                return ResponseEntity.badRequest().body("File size exceeds 1MB limit");
            }
            String key = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            String url = s3Service.uploadFile(key, file);
            logger.info("File uploaded successfully to S3: {}", url);
            return ResponseEntity.status(HttpStatus.CREATED).body(url);
        } catch (Exception e) {
            logger.error("File upload failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Upload failed. Please try again later.");
        }
    }
}
