package com.ustccb.ustcchat.util;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class PasswordUtilTest {
    @Test
    void hashAndMatch() {
        String h = PasswordUtil.hash("secret-123");
        assertTrue(PasswordUtil.matches("secret-123", h));
        assertFalse(PasswordUtil.matches("wrong", h));
    }
}
