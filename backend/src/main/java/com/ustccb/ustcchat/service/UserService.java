package com.ustccb.ustcchat.service;

import com.ustccb.ustcchat.dto.LoginRequest;
import com.ustccb.ustcchat.dto.RegisterRequest;
import com.ustccb.ustcchat.exception.BizException;
import com.ustccb.ustcchat.model.User;
import com.ustccb.ustcchat.model.mapper.UserMapper;
import com.ustccb.ustcchat.util.JwtUtil;
import com.ustccb.ustcchat.util.PasswordUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserMapper userMapper;
    private final JwtUtil jwt;

    public Map<String, Object> register(RegisterRequest req) {
        if (userMapper.findByEmail(req.getEmail()) != null) {
            throw BizException.badRequest("email already exists");
        }
        User u = new User();
        u.setUsername(req.getUsername());
        u.setEmail(req.getEmail());
        u.setPasswordHash(PasswordUtil.hash(req.getPassword()));
        u.setRole("USER");
        userMapper.insert(u);
        return tokenOf(u);
    }

    public Map<String, Object> login(LoginRequest req) {
        User u = userMapper.findByEmail(req.getEmail());
        if (u == null || !PasswordUtil.matches(req.getPassword(), u.getPasswordHash())) {
            throw BizException.unauthorized();
        }
        userMapper.updateLastLogin(u.getId());
        return tokenOf(u);
    }

    @Cacheable(value = "user:profile", key = "#userId")
    public User profile(Long userId) {
        User u = userMapper.findById(userId);
        if (u == null) throw BizException.notFound("user");
        u.setPasswordHash(null);
        return u;
    }

    private Map<String, Object> tokenOf(User u) {
        Map<String, Object> m = new HashMap<>();
        m.put("token", jwt.issue(u.getId(), u.getRole()));
        m.put("userId", u.getId());
        m.put("username", u.getUsername());
        m.put("role", u.getRole());
        return m;
    }
}
