package com.example.springbootjwtauth.controller;

import com.example.springbootjwtauth.service.S3Service;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class FileUploadControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private S3Service s3Service;

    @InjectMocks
    private FileUploadController fileUploadController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void uploadFile_validFile_returnsCreated() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "test content".getBytes());
        when(s3Service.uploadFile(anyString(), any())).thenReturn("https://bucket/test.pdf");
        mockMvc.perform(multipart("/api/files/upload").file(file))
                .andExpect(status().isCreated());
    }

    @Test
    void uploadFile_invalidType_returnsBadRequest() {
        MockMultipartFile file = new MockMultipartFile("file", "test.exe", "application/octet-stream", "bad".getBytes());
        ResponseEntity<?> response = fileUploadController.uploadFile(file);
        assertEquals(400, response.getStatusCodeValue());
        assertEquals("File type not allowed", response.getBody());
    }

    @Test
    void uploadFile_largeFile_returnsBadRequest() {
        byte[] large = new byte[2 * 1048576]; // 2MB
        MockMultipartFile file = new MockMultipartFile("file", "big.pdf", "application/pdf", large);
        ResponseEntity<?> response = fileUploadController.uploadFile(file);
        assertEquals(400, response.getStatusCodeValue());
        assertEquals("File size exceeds 1MB limit", response.getBody());
    }

    @Test
    void uploadFile_exception_returnsServerError() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "test content".getBytes());
        when(s3Service.uploadFile(anyString(), any())).thenThrow(new RuntimeException("S3 error"));
        mockMvc.perform(multipart("/api/files/upload").file(file))
                .andExpect(status().isInternalServerError());
    }
}
