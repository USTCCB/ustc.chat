package com.ustccb.ustcchat.service;

import com.ustccb.ustcchat.model.Conversation;
import com.ustccb.ustcchat.model.Message;
import com.ustccb.ustcchat.model.mapper.MessageMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.List;

/** 离线 mock LLM（避免真实 key）：按对话历史给出一个结构化回答 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LlmClient {

    private final MessageMapper msgMapper;

    @Value("${llm.mock:true}")
    private boolean mock;

    public String complete(Conversation conv, String userInput) {
        if (mock) {
            return mockReply(conv, userInput);
        }
        return "[live LLM disabled] 收到：" + userInput;
    }

    private String mockReply(Conversation conv, String userInput) {
        List<Message> hist = msgMapper.listByConversation(conv.getId());
        return "【" + conv.getModel() + "】(基于 " + hist.size() + " 条历史)\n"
             + "针对你的问题：「" + userInput + "」\n"
             + "建议：1) 明确问题边界 2) 拆分小步 3) 验证再扩展。";
    }
}
