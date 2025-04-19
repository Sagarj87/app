package com.example.springbootjwtauth.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/protected")
public class ProtectedController {
    @GetMapping
    public String protectedEndpoint() {
        return "This is a protected endpoint. You are authenticated!";
    }
}
