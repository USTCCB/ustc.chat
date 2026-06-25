package com.ustccb.ustcchat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Message {
    private Long id;
    private Long conversationId;
    private String role;
    private String content;
    private Integer tokens;
    private LocalDateTime createdAt;
}
