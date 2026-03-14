---
title: 如何后台运行linux命令
date: 2026-03-14 15:03:57
tags: 基操备忘录
---

在常见场景下，开发者往往在通过ssh链接远端服务器后选择直接执行命令。但是在面对像是模型下载、依赖更新等长时间任务往往会长时间占用任务窗口，导致任务效率低下。

<!--more-->

可以使用linux下的screen命令来创建新的窗口，并在新的窗口执行需要长时间运行的命令;好处在于在退出窗口时，任务不会中断，而是占用后台进程在后台运行，甚至是在退出服务器后，任务仍然会运行。

**screen常见命令：**

1.新建screen:

```bash
screen -S screen_name
```

2.退出当前screen到主界面:
 
 ctrl+A+D

3.查询当前screen列表：

```bash
screen -ls
```

4.定向连接到指定screen：

```bash
screen -r screen_name
```

5.远程dettach某个会话：

当某个screen session是attach状态，但是你并不在其中时，可以使用

```bash
screen -d screen_name
```

6.删除session：

```bash
screen -X -S session_name quit
```


7.清理死掉的对话session：

```bash
screen -wipe
```





