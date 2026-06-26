---
title: openclaw原理-0
date: 2026-06-26 10:25:49
tags: 源码学习
---

该文档用于记录对openclaw的学习以及思考，主要聚焦于openclaw的实现原理以及网关的概念如何实现。

<!--more-->

# 核心架构

一个基本的Agent的核心架构基本如下:

        User -> user_messages <-------------------- | <---------------- |
                      |                                                 |
                      V                                                 |
                client.messages.create()                                |
                      |                                                 |
                      V                                                 |
                 stop_reason |-> "end_turn" -> messages[]               |
                             |                                          |    
                             |-> "tool_use" -> tool_use_message --> messages[]

**思考**: 不管是普通的Agent还是智能网关，核心都是创建一个while true的循环，然后不断让assistant和user进行交互，然后根据交互结果进行判断，是否结束循环。

# 核心要点:
- messages: 储存用户与agent的对话状态,一般是user--agent--user--agent--user......
- stop_reason: 储存当前会话的结束原因,"end_turn"表示任务结束，"tool_use"表示使用工具,该位置是唯一决策点
- 该循环结构永远不会变，后续所有逻辑都是基于该结构进行扩展


**参考代码**：

```python
def agent_loop() -> None:
    messages: list[dict] = []

    while True:
        try:
            user_input = input(colored_prompt()).strip()
        except (KeyboardInterrupt, EOFError):
            break

        if not user_input:
            continue
        if user_input.lower() in ("quit", "exit"):
            break

        messages.append({"role": "user", "content": user_input})

        try:
            response = client.messages.create(
                model=MODEL_ID,
                max_tokens=8096,
                system=SYSTEM_PROMPT,
                messages=messages,
            )
        except Exception as exc:
            print(f"API Error: {exc}")
            messages.pop()   # 回滚, 让用户可以重试
            continue

        if response.stop_reason == "end_turn":
            assistant_text = ""
            for block in response.content:
                if hasattr(block, "text"):
                    assistant_text += block.text
            print_assistant(assistant_text)

            messages.append({
                "role": "assistant",
                "content": response.content,
            })
```

# openclaw在生产环境中的实现：
- 循环位置: AgentLoop类 位于 src/agent中
- 消息存储：JSONL 持久化的SessionStore
- stop_reason： 逻辑相同+SSE支持
- 错误恢复：退避重试+上下文保护
- 系统提示词：上下文拼接

