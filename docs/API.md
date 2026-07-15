# 接口文档（v1）

开发环境基址（经 Vite 代理）：`/api/v1`  
交互式文档：`http://127.0.0.1:8001/docs`

## 健康检查

`GET /health` → `{ "status": "ok", "app": "..." }`

## 工作台

`GET /dashboard`

返回汇总指标、协议统计、最近任务/载荷/告警、时序数据。

## 任务

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/tasks` | 任务列表（`status`、`q`） |
| GET | `/tasks/{id}` | 任务详情 |
| POST | `/tasks/upload` | 表单字段 `file` 上传 PCAP |
| POST | `/tasks/{id}/reparse` | 重新入队解析 |

## 会话

`GET /sessions?task_id=&protocol=&q=`

## 载荷

| 方法 | 路径 |
|------|------|
| GET | `/payloads?task_id=&session_id=&type=&q=` |
| GET | `/payloads/{id}` |

## 告警

| 方法 | 路径 |
|------|------|
| GET | `/alerts?level=&status=` |
| POST | `/alerts/{id}/resolve` |

## 日志与配置

- `GET /logs`
- `GET /settings` · `PUT /settings`
- `GET /stats/protocols`

## 错误格式

HTTP 状态码 + JSON：`{ "detail": "错误说明" }`
