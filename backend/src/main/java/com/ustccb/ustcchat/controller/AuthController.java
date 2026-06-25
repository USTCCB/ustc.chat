package com.ustccb.ustcchat.controller;

import com.ustccb.ustcchat.aop.RateLimit;
import com.ustccb.ustcchat.dto.ApiResponse;
import com.ustccb.ustcchat.dto.LoginRequest;
import com.ustccb.ustcchat.dto.RegisterRequest;
import com.ustccb.ustcchat.model.User;
import com.ustccb.ustcchat.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Tag(name = "Auth")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService users;

    @RateLimit(permit = 5, window = 60)
    @PostMapping("/register")
    public ApiResponse<Map<String,Object>> register(@Valid @RequestBody RegisterRequest req) {
        return ApiResponse.ok(users.register(req));
    }

    @RateLimit(permit = 10, window = 60)
    @PostMapping("/login")
    public ApiResponse<Map<String,Object>> login(@Valid @RequestBody LoginRequest req) {
        return ApiResponse.ok(users.login(req));
    }

    @GetMapping("/me")
    public ApiResponse<User> me(HttpServletRequest req) {
        Long uid = (Long) req.getAttribute("userId");
        return ApiResponse.ok(users.profile(uid));
    }
}
