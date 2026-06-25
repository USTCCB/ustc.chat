package com.ustccb.ustcchat.controller;

import com.ustccb.ustcchat.aop.RateLimit;
import com.ustccb.ustcchat.dto.ApiResponse;
import com.ustccb.ustcchat.dto.ChatResponse;
import com.ustccb.ustcchat.model.Conversation;
import com.ustccb.ustcchat.model.Message;
import com.ustccb.ustcchat.service.ChatService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Tag(name = "Chat")
@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chat;

    @Operation(summary = "列出当前用户的会话")
    @GetMapping("/conversations")
    public ApiResponse<List<Conversation>> list(HttpServletRequest req,
                                                @RequestParam(defaultValue = "20") int limit) {
        Long uid = (Long) req.getAttribute("userId");
        return ApiResponse.ok(chat.listConversations(uid, limit));
    }

    @Operation(summary = "获取会话历史消息")
    @GetMapping("/conversations/{id}/messages")
    public ApiResponse<List<Message>> messages(@PathVariable Long id) {
        return ApiResponse.ok(chat.listMessages(id));
    }

    @Operation(summary = "发送一条消息，自动建会话/接上下文")
    @RateLimit(permit = 30, window = 60)
    @PostMapping("/send")
    public ApiResponse<ChatResponse> send(HttpServletRequest req,
                                          @RequestParam(required = false) Long conversationId,
                                          @RequestParam @NotBlank String content) {
        Long uid = (Long) req.getAttribute("userId");
        return ApiResponse.ok(chat.sendMessage(uid, conversationId, content));
    }

    @Operation(summary = "健康检查")
    @GetMapping("/ping")
    public ApiResponse<Map<String,Object>> ping() {
        return ApiResponse.ok(Map.of("ok", true, "service", "ustc-chat-backend"));
    }
}
