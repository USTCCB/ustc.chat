package com.ustccb.ustcchat;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableCaching
@EnableScheduling
@MapperScan("com.ustccb.ustcchat.model.mapper")
@SpringBootApplication
public class UstcChatApplication {

    public static void main(String[] args) {
        SpringApplication.run(UstcChatApplication.class, args);
    }
}
