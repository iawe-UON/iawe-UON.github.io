---
title: 迁移服务时项目中docker bridge与宿主机其他服务通信的问题解决
date: 2026-06-05 15:26:23
tags: 工具箱和debug记录
---

迁移服务时项目中docker bridge与宿主机其他服务通信的问题解决方案

<!--more-->

# 问题概述

今天运维同学要维护服务器，要求将部署好的服务迁移到其他的服务器中。将项目打包部署到新的服务器后发现Agent执行任务时mcp工具访问不了宿主机上的MinIO服务和我写好的网络接口，查看日志后日志显示连接超时。

但是将与MinIO进行交互的代码单独在宿主机中执行又可以连接上MinIO和第三方接口:)

对于这种让人摸不着头脑的问题我准备单独写一个解决方案来记录一下。

# 可能的几点原因

- 访问地址错误（配置文件没写好）
- 接口服务/MinIO服务没启动或故障
- 防火墙 / 安全组没有放通新服务器到指定地址
- MinIO 只绑定了本机或旧网段，不允许新服务器访问。
- 容器网络无法访问该内网 IP，宿主机能访问但 Docker 容器不能访问。

# 排查步骤：

先通过docker ps检查所有的docker服务，查看MinIO容器状态和接口状态，进入日志查看日志。 结果显示MinIO和接口状态正常

排除原因1、2，那么问题可能出现在docker 网络/路由或者是宿主机防火墙/网络的问题。

## 排查步骤：

先检查宿主机网络环境能否联通MinIO，直接在命令行执行以下命令：

```bash
curl -v http://10.68.43.46:9010/minio/health/live
```

如果没卡住或者显示fail等信息，那么就说明宿主机是能够联通MinIO的

再检查项目docker容器中能否连通MinIO，执行以下命令：

```bash
docker exec <项目容器名称> curl -v http://10.68.43.46:9010/minio/health/live
```

此时发现连接过程卡住了，显示try to connect...，由此可以推断是docker网络的问题

```text
宿主机网络命名空间 -> 10.68.43.46:9010 可达
Docker bridge 容器网络命名空间 -> 10.68.43.46:9010 不可达
```

那么另一条路，如果容器跟宿主机都不可链接，那么说明就是宿主机本身有问题，需要排查宿主机的网络配置。

**容器不能联通而宿主机联通的可能原因**：

- docker bridge 网段和目标内网路由冲突
- 防火墙只允许宿主机IP，不允许容器NAT出口
- Docker iptables / FORWARD 链限制
- 新服务器有 VPN / 专线，只对宿主机 namespace 生效
- MinIO 服务或防火墙限制了访问来源网段

最快的一个验证方式是将docker-compose中的网络模式改成host，使用宿主机的网络来进行网络访问。（但是要删掉端口映射配置和networks配置）

```yaml
network_mode:host
```

改成这样重新部署，再执行：
```bash
docker exec <项目容器名称> curl -v http://10.68.43.46:9010/minio/health/live
```

如果可以联通，那就坐实了是NAT的问题。如果不是，那么就要检查Docker Bridge的网段是否和内网冲突，需要检查网段

```bash
sudo iptables -L INPUT -n -v
sudo iptables -L FORWARD -n -v
sudo iptables -L DOCKER-USER -n -v
sudo iptables -t nat -L -n -v
sudo ufw status verbose
```
通过以上代码检查流量信息，重点看有没有DROP/REJECT信息从172.19.0.0/16发出到10.68.43.46:9010

检查后发现有对应流量被拦截，说明防火墙的问题，那么问题在此得到解决

执行以下代码，直接放通流量：
```bash
sudo iptables -I INPUT -s 172.19.0.0/16 -d <宿主机地址> -p tcp --dport <宿主机对应服务端口号> -j ACCEPT
```

执行后再次执行该命令，发现可以联通：
```bash
docker exec <项目容器名称> curl -v http://10.68.43.46:9010/minio/health/live
```

问题解决！

