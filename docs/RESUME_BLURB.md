# 简历 / 作品集话术（PayloadX）

## 一句话

独立设计并实现开源项目 **PayloadX**：面向 PCAP 的应用层载荷提取与调查控制台，含异步解析流水线、REST API 与运维风格 Web 界面。

## 项目经历条目（3–5 条）

- 设计并实现流量应用载荷提取系统 **PayloadX**：PCAP 上传、异步解析、五元组会话聚合、HTTP/DNS/TLS 载荷提取与告警。  
- 后端采用 **FastAPI + SQLAlchemy**，核心路径使用标准库 PCAP 解析，降低依赖；提供 OpenAPI 与任务状态机。  
- 前端采用 **React + TypeScript + Tailwind** 工作台，开发期同源 API 代理；支持 Docker Compose 一键部署。  
- 补齐开源工程规范：CI、pytest、MIT、安全说明/贡献指南、结构化日志与配置管理。  
- 可演示完整链路：上传捕获 → 会话/载荷 Hex 研判 → 敏感字段告警 → 协议统计。

## 关键词

`网络取证` `PCAP` `FastAPI` `React` `SQLAlchemy` `流量分析` `REST` `Docker`
