# 部署指南

## Docker Compose（推荐）

```bash
docker compose up --build -d
```

- Web：http://localhost:8080  
- API 文档：http://localhost:8001/docs  

数据保存在卷 `payloadx_data`、`payloadx_uploads`。

## 手工生产部署示意

1. 使用 systemd / supervisor 运行 `uvicorn`  
2. 前端 `npm run build`  
3. Nginx 托管 `dist/`，并将 `/api/` 反代到后端  
4. 如需 MySQL，配置 `DATABASE_URL`  
5. 限制外网暴露面，收紧上传大小  

## 环境变量

| 变量 | 默认 | 含义 |
|------|------|------|
| `DATABASE_URL` | `backend/data` 下 SQLite | SQLAlchemy 连接串 |
| `VITE_API_BASE` | `/api/v1` | 前端 API 前缀 |

## 验收检查

- `GET /api/v1/health` 返回 ok  
- 浏览器打开工作台无 CORS 报错  
- 上传演示 PCAP 后可看到载荷  
