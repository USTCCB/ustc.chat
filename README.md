# ustc.chat

USTC AI 聊天助手 —— 一个**多会话 AI 聊天 Web 应用**。用户在网页上注册登录、
开多个会话、和 LLM 多轮对话。LLM 默认走 mock（方便本地无 key 调试），`LlmClient`
是一个可替换的客户端抽象，未来接 OpenAI / DeepSeek 等。

## 技术栈

- 前端：Vite + React 18 + TypeScript
- 后端：Spring Boot 3.2.5 + Java 17 + MyBatis + Redis 7 + MySQL 8（生产） / H2（开发）
- 鉴权：JWT（`AuthInterceptor` + `JwtUtil`）
- 限流：基于 `@RateLimit` 注解 + AOP（Redis 滑动/固定窗口，INCR + EXPIRE）
- 缓存：`@Cacheable`（命名空间 `conversation:list` / `conversation:detail` / `user:profile`，Cache-Aside）
- 异常：`@RestControllerAdvice` 统一处理
- 可观测：`/actuator/health`；MyBatis 打开 `StdOutImpl` 打印 SQL
- 工具：Docker / Docker Compose / GitHub Actions

## 主要接口

| Method | Path | 鉴权 | 说明 |
|---|---|---|---|
| POST | /api/auth/register | 公开 | 注册 |
| POST | /api/auth/login | 公开 | 登录 |
| GET | /api/auth/me | JWT | 当前用户 |
| GET | /api/chat/conversations?limit=20 | JWT（缓存） | 会话列表 |
| GET | /api/chat/conversations/{id}/messages | JWT（缓存） | 历史消息 |
| POST | /api/chat/send?conversationId=&content= | JWT + 限流 | 发消息 |
| GET | /api/chat/ping | 公开 | 健康检查 |
| GET | /actuator/health | 公开 | 健康检查 |
| GET | /doc.html | 公开 | Knife4j API 文档 |

## 后端结构

```
backend/
  pom.xml
  Dockerfile / docker-compose.yml
  sql/schema.sql                 生产 MySQL DDL
  src/main/java/com/ustccb/ustcchat
    UstcChatApplication.java
    aop/        RateLimit + RateLimitAspect
    config/     Redis / OpenAPI / Cors / Web
    controller/ AuthController, ChatController
    dto/        ApiResponse, LoginRequest, RegisterRequest, ChatResponse
    exception/  BizException + GlobalExceptionHandler
    interceptor AuthInterceptor (JWT)
    model/      User, Conversation, Message (+ mapper)
    service/    UserService, ChatService, LlmClient
    util/       JwtUtil, PasswordUtil
  src/main/resources
    application.yml
    application-dev.yml          H2 内存库
    application-prod.yml         MySQL + Redis
    mapper/*.xml
    schema-h2.sql / data-h2.sql
```

## 本地启动

dev profile 用 H2，不需要 MySQL/Redis 也能跑大部分接口；接 Redis 后限流/缓存才生效。

```bash
cd backend
mvn spring-boot:run
```

或 Docker Compose 一键起 MySQL + Redis + 后端：

```bash
cd backend
docker compose up -d
```

## 测试

```bash
cd backend
mvn test
```

GitHub Actions 在 push / PR 时自动 `mvn clean verify` 并上传 jar artifact。

## 设计要点

- **限流**：`@RateLimit(permit, window)` + AOP；key = `rl:<endpoint>:<userKey>`；
  Redis `INCR` + `EXPIRE` 实现固定窗口。
- **缓存**：`RedisCacheManager` 集中管理 TTL，不同命名空间用不同 TTL；
  写操作 `@CacheEvict(allEntries=true)`。
- **数据访问**：MyBatis + XML Mapper（不引 JPA，保持 SQL 可控）；
  dev 用 H2，prod 用 MySQL。
- **LLM 接入**：`LlmClient` 已抽象（`service/LlmClient.java`），当前默认走 mock
  回复；替换为真实 LLM 时保持接口签名一致即可。
