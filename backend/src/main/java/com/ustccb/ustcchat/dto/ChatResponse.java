package com.ustccb.ustcchat.dto;

import com.ustccb.ustcchat.model.Conversation;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class ChatResponse {
    private String reply;
    private Conversation conversation;
    private int promptTokens;
    private int completionTokens;
    private long latencyMs;
    private List<String> tags;
}
