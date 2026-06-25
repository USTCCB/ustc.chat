package com.ustccb.ustcchat.exception;

import lombok.Getter;

@Getter
public class BizException extends RuntimeException {
    private final int code;
    public BizException(int code, String msg) { super(msg); this.code = code; }
    public static BizException notFound(String what)  { return new BizException(404, what + " not found"); }
    public static BizException badRequest(String msg) { return new BizException(400, msg); }
    public static BizException tooMany()              { return new BizException(429, "rate limit exceeded"); }
    public static BizException unauthorized()         { return new BizException(401, "unauthorized"); }
}
