package com.bmb.dto;

import lombok.Data;

public class AuthDtos {
    @Data
    public static class LoginRequest {
        private String email;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String name;
        private String email;
        private String password;
        private String phone;
        private String role; // "ROLE_USER" or "ROLE_ADMIN"
    }

    @Data
    public static class AuthResponse {
        private String token;
        private Long id;
        private String name;
        private String email;
        private String role;
        private String phone;
    }
}
