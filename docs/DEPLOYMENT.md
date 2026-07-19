# 部署指南

## Windows 原生启动（本机验收推荐）

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-all.ps1
```

- Web：http://127.0.0.1:5173
- API 文档：http://127.0.0.1:8001/docs

该路径使用 Node.js 与 Python 虚拟环境，不依赖 Docker，也是 UI V2 的实际验收方式。

## Docker Compose（可选部署方式）

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
| `UPLOAD_DIR` | `backend/uploads` | PCAP 证据文件目录 |
| `MAX_UPLOAD_MB` | `512` | 进程级上传安全上限 |
| `CORS_ORIGINS` | 本地 Vite/Preview 地址 | 允许直连 API 的精确来源列表 |
| `VITE_API_BASE` | `/api/v1` | 前端 API 前缀 |

## 验收检查

- `GET /api/v1/health` 返回 ok  
- 浏览器打开工作台无 CORS 报错  
- 上传演示 PCAP 后可看到载荷  
