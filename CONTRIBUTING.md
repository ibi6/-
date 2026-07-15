# 参与贡献 PayloadX

感谢你愿意改进 PayloadX。我们更欢迎 **小而可审** 的改动，以及 **如实更新文档**。

## 开发环境

### 后端

```bash
cd backend
python -m venv .venv
# Windows
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

### 前端

```bash
npm install
npm run dev
```

开发模式下，前端通过 Vite 将 `/api` 代理到 `http://127.0.0.1:8001`。

### 测试

```bash
cd backend
pytest -q
```

### 检查

```bash
# 前端
npm run build
npm run lint

# 后端（可选）
ruff check app
```

## 提交 PR 前请确认

- [ ] PR 描述里写清：解决了什么问题  
- [ ] 行为变更时补充/更新测试  
- [ ] 未提交密钥、本地数据库、大型 PCAP  
- [ ] 接口或交互有变化时同步改文档  
- [ ] 提交信息尽量使用：`feat:` / `fix:` / `docs:` / `chore:`  

## 代码结构（改哪里）

| 路径 | 职责 |
|------|------|
| `backend/app/services/pcap_parser.py` | PCAP 解析与载荷提取 |
| `backend/app/services/task_runner.py` | 异步任务 |
| `backend/app/api/routes.py` | REST 接口 |
| `src/pages` · `src/components` | 产品界面 |

## 行为准则

见 [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)。
