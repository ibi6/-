# 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/) 的写法，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2025-07-15

### 新增

- FastAPI 后端与异步 PCAP 解析任务  
- 标准库 PCAP 解析：IPv4/TCP/UDP、HTTP、DNS、TLS 启发式  
- SQLAlchemy 模型：任务、会话、载荷、告警、日志、配置  
- React 控制台：总览、捕获、载荷、协议、统计、告警、日志、设置  
- Vite 开发代理 `/api`  
- 首次启动自动生成演示 PCAP  
- Windows 一键启动脚本  
- 开源治理文档（LICENSE、贡献指南、安全说明等）  
- GitHub Actions CI（前端构建 + 后端 pytest）  
- Docker Compose 部署  

### 安全

- 上传类型与大小校验  
- SQLAlchemy 参数化查询  

## [未发布]

### 第二版界面（UI V2）

- 深海青网络取证品牌、桌面侧栏与移动抽屉统一
- 工作台、捕获、载荷、协议、告警、日志和设置页响应式精修
- README 徽章收敛，并加入真实工作台、捕获和 DNS 载荷截图
- 明确 UI V2 是 v1.0 的第二轮界面优化，不代表产品 v2.0

### 修复

- 列表过滤在数据库分页前执行，并消除会话载荷查询 N+1
- 上传目录、上传上限和界面提示统一使用运行配置
- 重复解析返回冲突，解析失败回滚并保留旧证据
- API 错误、输入枚举、正整数 ID、CORS 与敏感响应缓存策略收紧
- 移除虚假趋势和未实现协议/PCAPNG 能力描述

### 计划

- 登录鉴权与角色权限  
- 原生 PCAPNG 支持  
- 进程级任务队列（RQ / Celery）  
- 更多协议深度解析（如 MQTT）  
