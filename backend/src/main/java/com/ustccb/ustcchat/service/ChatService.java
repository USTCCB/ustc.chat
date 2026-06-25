package com.ustccb.ustcchat.service;

import com.ustccb.ustcchat.dto.ChatResponse;
import com.ustccb.ustcchat.exception.BizException;
import com.ustccb.ustcchat.model.Conversation;
import com.ustccb.ustcchat.model.Message;
import com.ustccb.ustcchat.model.mapper.ConversationMapper;
import com.ustccb.ustcchat.model.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ConversationMapper convMapper;
    private final MessageMapper msgMapper;
    private final LlmClient llm;

    @Cacheable(value = "conversation:list", key = "#userId + ':' + #limit")
    public List<Conversation> listConversations(Long userId, int limit) {
        return convMapper.listByUser(userId, Math.min(Math.max(limit, 1), 50));
    }

    @Cacheable(value = "conversation:detail", key = "#conversationId")
    public List<Message> listMessages(Long conversationId) {
        return msgMapper.listByConversation(conversationId);
    }

    @Transactional
    @CacheEvict(value = {"conversation:list","conversation:detail"}, allEntries = true)
    public ChatResponse sendMessage(Long userId, Long conversationId, String content) {
        Conversation conv;
        if (conversationId == null) {
            conv = new Conversation();
            conv.setUserId(userId);
            conv.setTitle(summarizeTitle(content));
            conv.setModel("gpt-4o-mini");
            conv.setPinned(false);
            convMapper.insert(conv);
        } else {
            conv = convMapper.findById(conversationId);
            if (conv == null || !conv.getUserId().equals(userId)) {
                throw BizException.notFound("conversation");
            }
        }

        Message userMsg = new Message();
        userMsg.setConversationId(conv.getId());
        userMsg.setRole("USER");
        userMsg.setContent(content);
        userMsg.setTokens(content.length() / 4);
        msgMapper.insert(userMsg);

        long t0 = System.currentTimeMillis();
        String reply = llm.complete(conv, content);
        long latency = System.currentTimeMillis() - t0;

        Message botMsg = new Message();
        botMsg.setConversationId(conv.getId());
        botMsg.setRole("ASSISTANT");
        botMsg.setContent(reply);
        botMsg.setTokens(reply.length() / 4);
        msgMapper.insert(botMsg);

        return new ChatResponse(reply, conv, userMsg.getTokens(), botMsg.getTokens(), latency,
                Arrays.asList("chat", conv.getModel()));
    }

    private String summarizeTitle(String s) {
        if (s == null) return "新对话";
        String t = s.replaceAll("\\s+", " ").trim();
        return t.length() > 20 ? t.substring(0, 20) + "…" : t;
    }
}
