package com.example.springbootjwtauth.controller;

import com.example.springbootjwtauth.entity.Role;
import com.example.springbootjwtauth.entity.User;
import com.example.springbootjwtauth.repository.RoleRepository;
import com.example.springbootjwtauth.repository.UserRepository;
import com.example.springbootjwtauth.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    private AuthenticationManager authenticationManager;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private RoleRepository roleRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private JwtUtil jwtUtil;

    @PostMapping("/register")
    public Map<String, String> register(@RequestBody Map<String, String> userMap) {
        String username = userMap.get("username");
        String password = userMap.get("password");
        if (userRepository.existsByUsername(username)) {
            return Collections.singletonMap("error", "Username already exists");
        }
        Role userRole = roleRepository.findByName("ROLE_USER")
                .orElseGet(() -> roleRepository.save(new Role(null, "ROLE_USER", null)));
        User user = new User();
        user.setUsername(username);
        user.setPassword(passwordEncoder.encode(password));
        user.setRoles(Collections.singleton(userRole));
        userRepository.save(user);
        return Collections.singletonMap("message", "User registered successfully");
    }

    @PostMapping("/login")
    public Map<String, String> login(@RequestBody Map<String, String> userMap) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            userMap.get("username"), userMap.get("password")));
            String token = jwtUtil.generateToken(userMap.get("username"));
            return Collections.singletonMap("token", token);
        } catch (AuthenticationException e) {
            return Collections.singletonMap("error", "Invalid username or password");
        }
    }
}
