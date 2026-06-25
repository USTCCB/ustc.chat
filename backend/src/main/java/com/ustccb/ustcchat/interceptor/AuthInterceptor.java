package com.ustccb.ustcchat.interceptor;

import com.ustccb.ustcchat.exception.BizException;
import com.ustccb.ustcchat.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
@RequiredArgsConstructor
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtUtil jwt;

    @Override
    public boolean preHandle(HttpServletRequest req, HttpServletResponse resp, Object handler) {
        String path = req.getRequestURI();
        if (path.startsWith("/api/auth/") || path.startsWith("/api/public/")
                || path.startsWith("/v3/api-docs") || path.startsWith("/swagger-ui")
                || path.startsWith("/doc.html") || path.startsWith("/actuator/health")) {
            return true;
        }
        String auth = req.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) throw BizException.unauthorized();
        try {
            Long uid = jwt.parseUserId(auth.substring(7));
            req.setAttribute("userId", uid);
            return true;
        } catch (Exception e) {
            throw BizException.unauthorized();
        }
    }
}
