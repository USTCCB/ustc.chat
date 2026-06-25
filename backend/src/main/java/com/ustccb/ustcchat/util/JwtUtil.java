package com.ustccb.ustcchat.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret:ustcchat-default-secret-please-change-in-production-32bytes}")
    private String secret;

    @Value("${jwt.expireMinutes:720}")
    private long expireMinutes;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String issue(Long userId, String role) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(new Date(now))
                .expiration(new Date(now + expireMinutes * 60_000))
                .signWith(key())
                .compact();
    }

    public Long parseUserId(String token) {
        Claims c = Jwts.parser().verifyWith(key()).build().parseSignedClaims(token).getPayload();
        return Long.valueOf(c.getSubject());
    }
}
