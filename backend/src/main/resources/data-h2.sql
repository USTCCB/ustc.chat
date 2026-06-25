INSERT INTO users (username, email, password_hash, role) VALUES
    (''demo'', ''demo@ustc.chat'', ''$2a$10$demoHashPlaceholderdemoHashPlaceholderdemoHash'', ''USER'');

INSERT INTO conversations (user_id, title, model, pinned) VALUES
    (1, ''Java 学习路线咨询'', ''gpt-4o-mini'', TRUE),
    (1, ''简历润色'', ''gpt-4o-mini'', FALSE);

INSERT INTO messages (conversation_id, role, content, tokens) VALUES
    (1, ''USER'', ''请给我一个 Java 后端实习学习路线'', 18),
    (1, ''ASSISTANT'', ''建议分四个阶段：基础、框架、中间件、实战项目...'', 220),
    (2, ''USER'', ''帮我把这句项目描述改得更有竞争力'', 16),
    (2, ''ASSISTANT'', ''使用 STAR 法则 + 量化指标...'', 180);
