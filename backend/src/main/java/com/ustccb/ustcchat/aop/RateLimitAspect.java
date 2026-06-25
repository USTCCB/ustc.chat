package com.ustccb.ustcchat.aop;

import com.ustccb.ustcchat.exception.BizException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Method;
import java.time.Duration;

@Slf4j
@Aspect
@Component
public class RateLimitAspect {

    @Autowired private StringRedisTemplate redis;

    @Around("@annotation(com.ustccb.ustcchat.aop.RateLimit)")
    public Object around(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        Method m = sig.getMethod();
        RateLimit rl = m.getAnnotation(RateLimit.class);
        String endpoint = m.getDeclaringClass().getSimpleName() + "#" + m.getName();
        String userKey = "anon";
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                userKey = req.getHeader("X-User-Id");
                if (userKey == null || userKey.isBlank()) userKey = req.getRemoteAddr();
            }
        } catch (Exception ignored) {}

        String key = "rl:" + endpoint + ":" + userKey;
        Long hits = redis.opsForValue().increment(key);
        if (hits != null && hits == 1L) {
            redis.expire(key, Duration.ofSeconds(rl.window()));
        }
        if (hits != null && hits > rl.permit()) {
            log.warn("rate limit hit {} {}", endpoint, userKey);
            throw BizException.tooMany();
        }
        return pjp.proceed();
    }
}
