package com.ustccb.ustcchat.model.mapper;

import com.ustccb.ustcchat.model.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {
    User findById(@Param("id") Long id);
    User findByEmail(@Param("email") String email);
    int insert(User user);
    int updateLastLogin(@Param("id") Long id);
}
