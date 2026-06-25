package com.ustccb.ustcchat.model.mapper;

import com.ustccb.ustcchat.model.Conversation;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface ConversationMapper {
    List<Conversation> listByUser(@Param("userId") Long userId, @Param("limit") int limit);
    Conversation findById(@Param("id") Long id);
    int insert(Conversation conv);
    int updateTitle(@Param("id") Long id, @Param("title") String title);
    int togglePinned(@Param("id") Long id, @Param("pinned") boolean pinned);
    int delete(@Param("id") Long id);
}
