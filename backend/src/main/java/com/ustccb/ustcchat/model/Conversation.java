package com.ustccb.ustcchat.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Conversation {
    private Long id;
    private Long userId;
    private String title;
    private String model;
    private Boolean pinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
