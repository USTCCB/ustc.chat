package com.ustccb.ustcchat.model.mapper;

import com.ustccb.ustcchat.model.Message;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface MessageMapper {
    List<Message> listByConversation(@Param("conversationId") Long conversationId);
    int insert(Message msg);
    int countByConversation(@Param("conversationId") Long conversationId);
}
