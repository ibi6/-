# PayloadX v1.0 Full Debug and UI V2 Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不扩展 v1.0 产品边界的前提下，完成 PayloadX 前后端、数据库、API、安全、性能、UI V2、文档和真实运行的完整优化与验收。

**Architecture:** 保持 React 19 + Vite 前端和 FastAPI + SQLAlchemy 后端的现有边界，通过小步 TDD 修复查询、上传、事务和交互问题。API 路径和现有返回结构保持兼容，视觉继续使用深海青证据工作台；最终使用原生 Node/Python 服务完成端到端验收，不调用 Docker。

**Tech Stack:** React 19, TypeScript 6, Vite 8, TailwindCSS 4, FastAPI, Pydantic 2, SQLAlchemy 2, SQLite, pytest, Node Test Runner, oxlint, ruff

---

## 文件结构与职责

- `backend/app/api/routes.py`：API 参数校验、数据库过滤、上传和设置行为。
- `backend/app/core/config.py`：环境变量和进程级安全上限。
- `backend/app/main.py`：应用生命周期、CORS、异常和安全响应头。
- `backend/app/services/task_runner.py`：解析任务并发保护、事务和错误状态。
- `backend/app/models/entities.py`：与查询证据一致的索引定义。
- `backend/tests/test_api.py`：接口、上传、过滤、配置和响应头回归测试。
- `backend/tests/test_task_runner.py`：任务去重与解析失败事务测试。
- `src/lib/api.ts` / `src/lib/api.test.ts`：统一请求、错误解析和查询参数。
- `src/pages/*.tsx`：逐页真实状态、筛选、反馈和响应式修复。
- `src/index.css`：UI V2 设计令牌、层级、响应式和减弱动画。
- `README.md` / `docs/assets/*`：第二版品牌展示和真实截图。
- `docs/VALIDATION-V2.md`：问题、修改、命令、结果、剩余边界和评分。

### Task 1: 建立可复现基线

**Files:**
- Verify: `package-lock.json`
- Verify: `backend/requirements.txt`
- Verify: `backend/requirements-dev.txt`

- [x] **Step 1: 锁定并安装前端依赖**

Run:

```powershell
npm ci
```

Expected: exit code 0，依赖版本来自 `package-lock.json`。

- [x] **Step 2: 创建或复用后端虚拟环境并安装依赖**

Run:

```powershell
if (-not (Test-Path .\backend\.venv\Scripts\python.exe)) { python -m venv .\backend\.venv }
.\backend\.venv\Scripts\python.exe -m pip install -r .\backend\requirements.txt -r .\backend\requirements-dev.txt
```

Expected: exit code 0；后续 Python 命令固定使用该解释器。

- [x] **Step 3: 记录未修改代码的自动化基线**

Run:

```powershell
npm test
npm run lint
npm run build
Push-Location backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check app tests
Pop-Location
```

Expected: 保存每条命令的真实通过/失败结果；失败项进入后续任务，不隐藏。

- [x] **Step 4: 记录 Git 基线**

Run:

```powershell
git status --short --branch
git log -5 --oneline
git remote -v
```

Expected: 当前分支为 `codex/ui-overall-optimization`，远端指向 `https://github.com/ibi6/-.git`，仅设计/计划文档为本轮改动。

### Task 2: 修复 API 过滤、边界和 N+1

**Files:**
- Modify: `backend/app/api/routes.py`
- Test: `backend/tests/test_api.py`

- [x] **Step 1: 添加“先过滤、再限制”和有界查询的失败测试**

在 `backend/tests/test_api.py` 增加：

```python
def test_task_query_filters_before_limit(client: TestClient, tmp_path: Path):
    for name in ("alpha.pcap", "target.pcap"):
        pcap = tmp_path / name
        _build_demo_pcap(pcap)
        with pcap.open("rb") as stream:
            response = client.post(
                "/api/v1/tasks/upload",
                files={"file": (name, stream, "application/vnd.tcpdump.pcap")},
            )
        assert response.status_code == 200

    response = client.get("/api/v1/tasks", params={"q": "alpha", "limit": 1})
    assert response.status_code == 200
    assert [item["filename"] for item in response.json()] == ["alpha.pcap"]


def test_list_query_rejects_unbounded_or_oversized_input(client: TestClient):
    assert client.get("/api/v1/tasks", params={"limit": 0}).status_code == 422
    assert client.get("/api/v1/payloads", params={"limit": 2001}).status_code == 422
    assert client.get("/api/v1/sessions", params={"q": "x" * 201}).status_code == 422
```

- [x] **Step 2: 运行测试并确认旧实现失败**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py::test_task_query_filters_before_limit tests/test_api.py::test_list_query_rejects_unbounded_or_oversized_input -q
Pop-Location
```

Expected: FAIL，因为 `/tasks` 尚无 `limit` 校验，且搜索在取数后由 Python 过滤。

- [x] **Step 3: 将过滤下推到 SQL 并统一分页参数**

在 `backend/app/api/routes.py` 引入 `or_`，并采用以下模式实现任务、会话、载荷和告警列表：

```python
from sqlalchemy import String, cast, func, or_, select

def _search_term(value: str | None) -> str | None:
    normalized = (value or "").strip()
    return normalized.casefold() or None


@router.get("/tasks", response_model=list[TaskOut])
def list_tasks(
    status: str | None = Query(default=None, max_length=20),
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    stmt = select(CaptureTask)
    if status and status != "all":
        stmt = stmt.where(CaptureTask.status == status)
    if term := _search_term(q):
        like = f"%{term}%"
        stmt = stmt.where(
            or_(
                func.lower(CaptureTask.name).like(like),
                func.lower(CaptureTask.filename).like(like),
                cast(CaptureTask.id, String).like(like),
            )
        )
    rows = db.scalars(stmt.order_by(CaptureTask.id.desc()).offset(offset).limit(limit)).all()
    return [task_out(row) for row in rows]
```

对 `/sessions`、`/payloads` 和 `/alerts` 使用相同顺序：组合 `where` → `order_by` → `offset` → `limit`，不再对已截断的 Python 列表二次过滤。

- [x] **Step 4: 批量查询会话的载荷 ID**

将逐会话查询替换为一次批量查询：

```python
session_ids = [row.id for row in sessions]
payload_ids_by_session: dict[int, list[int]] = {session_id: [] for session_id in session_ids}
if session_ids:
    payload_rows = db.execute(
        select(Payload.session_id, Payload.id)
        .where(Payload.session_id.in_(session_ids))
        .order_by(Payload.id)
    ).all()
    for session_id, payload_id in payload_rows:
        if session_id is not None:
            payload_ids_by_session[session_id].append(payload_id)
return [session_out(row, payload_ids_by_session[row.id]) for row in sessions]
```

- [x] **Step 5: 回归后端测试并提交**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q
.\.venv\Scripts\python.exe -m ruff check app tests
Pop-Location
git add backend/app/api/routes.py backend/tests/test_api.py
git commit -m "fix(api): enforce bounded database filtering"
```

Expected: 测试和 ruff 全部通过，产生一个查询修复提交。

### Task 3: 统一上传配置与敏感响应保护

**Files:**
- Modify: `backend/app/core/config.py`
- Modify: `backend/app/api/routes.py`
- Modify: `backend/app/db/session.py`
- Modify: `backend/app/main.py`
- Modify: `backend/.env.example`
- Test: `backend/tests/test_api.py`
- Create: `backend/tests/test_config.py`

- [x] **Step 1: 添加目录配置和安全响应头测试**

在 `backend/tests/test_api.py` 增加：

```python
def test_api_disables_sensitive_response_caching(client: TestClient):
    response = client.get("/api/v1/dashboard")
    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"


def test_upload_uses_configured_directory(
    client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    configured = tmp_path / "configured-uploads"
    monkeypatch.setattr(routes_mod.settings, "upload_dir", str(configured))
    pcap = tmp_path / "configured.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as stream:
        response = client.post(
            "/api/v1/tasks/upload",
            files={"file": (pcap.name, stream, "application/vnd.tcpdump.pcap")},
        )
    assert response.status_code == 200
    assert any(configured.iterdir())
```

- [x] **Step 2: 确认旧实现未使用 `settings.upload_dir`**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py::test_api_disables_sensitive_response_caching tests/test_api.py::test_upload_uses_configured_directory -q
Pop-Location
```

Expected: FAIL，旧实现写固定 `UPLOAD_DIR` 且未设置全部响应头。

- [x] **Step 3: 让上传路径以环境配置为唯一来源**

在 `backend/app/api/routes.py` 添加：

```python
def _upload_dir() -> Path:
    path = Path(settings.upload_dir).expanduser().resolve()
    path.mkdir(parents=True, exist_ok=True)
    return path
```

上传接口使用 `upload_dir = _upload_dir()` 和 `dest = upload_dir / safe`；测试夹具改为 monkeypatch `settings.upload_dir`，不再 monkeypatch 模块常量。

- [x] **Step 4: 为 API 增加不缓存和基础安全头**

在 `backend/app/main.py` 增加中间件：

```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):  # noqa: ANN001
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    if request.url.path.startswith("/api/"):
        response.headers["Cache-Control"] = "no-store"
    return response
```

同时在 `backend/.env.example` 明确 `UPLOAD_DIR`、`MAX_UPLOAD_MB` 和精确 `CORS_ORIGINS` 示例。

- [x] **Step 5: 运行回归并提交**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py -q
.\.venv\Scripts\python.exe -m ruff check app tests
Pop-Location
git add backend/app/core/config.py backend/app/api/routes.py backend/app/main.py backend/.env.example backend/tests/test_api.py
git commit -m "fix(security): align upload storage and response policy"
```

Expected: 全部通过。

### Task 4: 保证解析任务去重和失败事务完整性

**Files:**
- Modify: `backend/app/api/routes.py`
- Modify: `backend/app/services/task_runner.py`
- Create: `backend/tests/test_task_runner.py`

- [x] **Step 1: 写解析失败不删除旧证据的测试**

创建 `backend/tests/test_task_runner.py`，先写完整的临时数据库夹具与事务测试：

```python
import threading
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.entities import CaptureTask, FlowSession
from app.services import task_runner


@pytest.fixture()
def db_factory():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    return sessionmaker(bind=engine, autoflush=False, autocommit=False)


def test_failed_reparse_keeps_previous_evidence(db_factory, tmp_path: Path, monkeypatch):
    capture_path = tmp_path / "case.pcap"
    capture_path.write_bytes(b"existing capture")
    with db_factory() as db:
        task = CaptureTask(name="case", filename="case.pcap", file_path=str(capture_path))
        db.add(task)
        db.flush()
        db.add(FlowSession(task_id=task.id, protocol="TCP"))
        db.commit()
        task_id = task.id
    monkeypatch.setattr(task_runner, "SessionLocal", db_factory)
    monkeypatch.setattr(
        task_runner,
        "parse_pcap_file",
        lambda _: SimpleNamespace(
            packet_count=1,
            protocols=["TCP"],
            sessions=[{"stream_key": "incomplete"}],
            payloads=[],
            alerts=[],
        ),
    )

    task_runner.run_parse_task(task_id)

    with db_factory() as db:
        assert db.scalar(select(func.count()).select_from(FlowSession)) == 1
        assert db.get(CaptureTask, task_id).status == "failed"
```

- [x] **Step 2: 写同一任务只启动一次的测试**

在同一文件增加：

```python
def test_start_parse_async_deduplicates_active_task(monkeypatch):
    started = threading.Event()
    release = threading.Event()

    def blocking_run(_task_id: int) -> None:
        started.set()
        release.wait(timeout=2)

    monkeypatch.setattr(task_runner, "run_parse_task", blocking_run)
    assert task_runner.start_parse_async(42) is True
    assert started.wait(timeout=1)
    assert task_runner.start_parse_async(42) is False
    release.set()
```

这里的第二次启动断言必须发生在第一个线程释放前；测试结束后 `release.set()` 允许守护线程正常清理活动集合。

- [x] **Step 3: 运行新测试并确认失败**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_task_runner.py -q
Pop-Location
```

Expected: FAIL，因为旧异常路径没有先回滚，且启动函数没有返回去重结果。

- [x] **Step 4: 实现回滚和线程去重**

在 `task_runner.py` 使用锁保护活动任务集合：

```python
_active_task_ids: set[int] = set()
_active_task_lock = threading.Lock()


def _run_and_release(task_id: int) -> None:
    try:
        run_parse_task(task_id)
    finally:
        with _active_task_lock:
            _active_task_ids.discard(task_id)


def start_parse_async(task_id: int) -> bool:
    with _active_task_lock:
        if task_id in _active_task_ids:
            return False
        _active_task_ids.add(task_id)
    thread = threading.Thread(target=_run_and_release, args=(task_id,), daemon=True)
    thread.start()
    return True
```

在 `run_parse_task` 的异常分支先 `db.rollback()`，再重新读取任务、设置 `failed`、写错误日志并提交，确保未提交的删除和插入不会随失败状态一起提交。重新解析接口对活动状态返回 409。

- [x] **Step 5: 回归并提交**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check app tests
Pop-Location
git add backend/app/api/routes.py backend/app/services/task_runner.py backend/tests/test_task_runner.py
git commit -m "fix(parser): protect reparse transactions and duplicates"
```

Expected: 后端完整测试与 ruff 通过。

### Task 5: 统一前端 API 错误和请求参数

**Files:**
- Modify: `src/lib/api.ts`
- Create: `src/lib/api.test.ts`
- Modify: `package.json`

- [x] **Step 1: 为非 JSON、校验错误和空白查询写失败测试**

创建 `src/lib/api.test.ts`：

```typescript
import assert from 'node:assert/strict'
import test from 'node:test'
import { api, ApiError } from './api.ts'

test('surfaces FastAPI validation messages without dumping JSON', async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () =>
    new Response(JSON.stringify({ detail: [{ msg: 'Input should be greater than 0' }] }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    })
  try {
    await assert.rejects(api.health(), (error: unknown) => {
      assert.ok(error instanceof ApiError)
      assert.equal(error.message, 'Input should be greater than 0')
      return true
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('omits blank search parameters', async () => {
  const originalFetch = globalThis.fetch
  let requested = ''
  globalThis.fetch = async (input) => {
    requested = String(input)
    return Response.json([])
  }
  try {
    await api.tasks({ q: '   ' })
    assert.equal(requested, '/api/v1/tasks')
  } finally {
    globalThis.fetch = originalFetch
  }
})
```

- [x] **Step 2: 将新测试加入 Node Test Runner 并确认失败**

将 `package.json` 的测试脚本加入 `src/lib/api.test.ts`，运行：

```powershell
npm test
```

Expected: FAIL，旧代码序列化整段校验 JSON，且保留空白 `q`。

- [x] **Step 3: 实现稳定错误提取和参数清洗**

在 `src/lib/api.ts` 增加：

```typescript
type FastApiDetail = string | { msg?: unknown }[]

function errorMessage(detail: FastApiDetail | undefined, fallback: string): string {
  if (typeof detail === 'string' && detail.trim()) return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (typeof item.msg === 'string' ? item.msg.trim() : ''))
      .filter(Boolean)
    if (messages.length) return messages.join('；')
  }
  return fallback || '请求失败，请稍后重试'
}

function setTrimmed(sp: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim()
  if (normalized) sp.set(key, normalized)
}
```

所有字符串查询参数通过 `setTrimmed` 写入；网络错误保持原始 `Error`，HTTP 错误统一为带状态码的 `ApiError`。

- [x] **Step 4: 前端回归并提交**

Run:

```powershell
npm test
npm run lint
npm run build
git add package.json src/lib/api.ts src/lib/api.test.ts
git commit -m "fix(frontend): normalize API errors and queries"
```

Expected: 测试、lint、TypeScript 和 Vite 构建通过。

### Task 6: 清除虚假指标并修正设置语义

**Files:**
- Modify: `backend/app/api/routes.py`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Settings.tsx`
- Test: `backend/tests/test_api.py`

- [x] **Step 1: 写仪表盘不伪造趋势的测试**

在 `backend/tests/test_api.py` 增加：

```python
def test_dashboard_does_not_invent_trends(client: TestClient):
    data = client.get("/api/v1/dashboard").json()
    assert data["capture_trend"] == 0
    assert data["payload_trend"] == 0
    assert data["anomaly_trend"] == 0
```

- [x] **Step 2: 运行并确认旧硬编码趋势导致失败**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest tests/test_api.py::test_dashboard_does_not_invent_trends -q
Pop-Location
```

Expected: FAIL，旧返回值包含 `5.2`、`3.1` 和 `-1.0`。

- [x] **Step 3: 返回诚实指标并调整界面文案**

后端在没有历史时间窗证据时返回 `0`。`Dashboard.tsx` 将 `0` 显示为“当前累计”，非零时才显示带方向的趋势；不得用颜色暗示不存在的改善。

`Settings.tsx` 将 `storage_path` 输入改为只读信息行：

```tsx
<div className="rounded-2xl border border-line bg-ink-50/70 px-4 py-3">
  <div className="text-xs font-medium text-ink-700">证据存储目录</div>
  <code className="mt-1 block break-all text-xs text-muted">{form.storage_path}</code>
  <p className="mt-1 text-[11px] text-muted">由后端环境变量 UPLOAD_DIR 配置，重启后生效。</p>
</div>
```

保存请求仍携带当前值以保持 API 兼容，但界面不再承诺热更新目录。

- [x] **Step 4: 回归并提交**

Run:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest -q
Pop-Location
npm test
npm run lint
npm run build
git add backend/app/api/routes.py backend/tests/test_api.py src/pages/Dashboard.tsx src/pages/Settings.tsx
git commit -m "fix(product): keep metrics and settings truthful"
```

Expected: 全部通过。

### Task 7: 完成 UI V2 全站精修与响应式修复

**Files:**
- Modify: `src/index.css`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Loading.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Capture.tsx`
- Modify: `src/pages/TaskDetail.tsx`
- Modify: `src/pages/Payloads.tsx`
- Modify: `src/pages/PayloadDetail.tsx`
- Modify: `src/pages/Protocols.tsx`
- Modify: `src/pages/Stats.tsx`
- Modify: `src/pages/Alerts.tsx`
- Modify: `src/pages/Settings.tsx`
- Modify: `src/pages/Logs.tsx`
- Modify: `src/pages/Features.tsx`
- Modify: `src/pages/Help.tsx`

- [x] **Step 1: 建立 UI 验收清单并截取修改前页面**

启动原生服务后，在 375×812、768×1024、1024×768、1440×900、1920×1080 检查：根页面横向溢出、移动抽屉、卡片层级、筛选栏、表格局部滚动、空状态、错误状态、焦点环和 44px 点击区域。保存修改前证据到本地验收目录，不提交含本机信息的图片。

- [x] **Step 2: 强化全局设计令牌和卡片层级**

在 `src/index.css` 增加稳定的三层表面令牌并统一交互过渡：

```css
:root {
  --surface-canvas: #f2f5f4;
  --surface-panel: rgba(255, 255, 255, 0.94);
  --surface-subtle: #f7f9f8;
  --shadow-panel: 0 1px 2px rgba(7, 20, 29, 0.04), 0 18px 44px -30px rgba(7, 20, 29, 0.3);
}

.card-surface {
  background: var(--surface-panel);
  border: 1px solid rgba(15, 35, 44, 0.075);
  box-shadow: var(--shadow-panel);
}

.interactive-row {
  transition: background-color 160ms ease, border-color 160ms ease;
}

.interactive-row:hover {
  background: var(--surface-subtle);
}
```

保留现有深海青品牌，不引入第二套紫色主品牌。

- [x] **Step 3: 逐页修复真实状态和窄屏布局**

按页面执行并在每页修改后运行 `npm run build`：

- Dashboard：手机端一主四次指标布局，零趋势使用“当前累计”。
- Capture：上传校验、错误、进度和任务统计不跳动；按钮在 375px 不溢出。
- TaskDetail：完成/失败/处理中状态和重新解析反馈明确。
- Payloads：筛选条局部横向滚动，表格局部滚动，卡片模式无长文本溢出。
- PayloadDetail：长元数据、Hex 和预览只在内容区滚动；复制操作显示完成反馈。
- Protocols/Stats：图表容器设置明确高度和最小宽度，零数据使用空状态。
- Alerts/Logs/Features：窄屏表格容器使用 `overflow-x-auto`，不让根页面溢出。
- Settings/Help：标签、代码和路径使用 `break-words`/`break-all`，保存状态可感知。

- [x] **Step 4: 运行前端自动检查**

Run:

```powershell
npm test
npm run lint
npm run build
```

Expected: 全部通过，`dist/` 生成成功，无 TypeScript 或 oxlint 错误。

- [x] **Step 5: 在五档视口复查并提交**

逐档确认 `document.documentElement.scrollWidth === window.innerWidth`；仅表格、筛选轨和 Hex 容器允许局部横向滚动。

Run:

```powershell
git add src
git commit -m "feat(ui): polish the second-edition forensic workspace"
```

Expected: UI V2 精修形成独立提交。

### Task 8: 高级化 README 并加入真实第二版截图

**Files:**
- Modify: `README.md`
- Modify: `docs/assets/banner.svg`
- Create: `docs/assets/screenshots/dashboard-v2.png`
- Create: `docs/assets/screenshots/payload-v2.png`
- Create: `docs/assets/screenshots/capture-v2.png`
- Modify: `CHANGELOG.md`

- [x] **Step 1: 使用真实运行数据拍摄三张界面图**

在 1440×900 使用项目演示 PCAP，分别拍摄调查工作台、载荷详情和流量捕获。检查图片不包含绝对路径、环境变量、个人用户名或调试面板，再保存到 `docs/assets/screenshots/`。

- [x] **Step 2: 收敛顶部徽章并强化第二版说明**

README 顶部只保留 Release、Build、Python、React 四个核心状态徽章；将 FastAPI、SQLAlchemy、SQLite/MySQL、Tailwind 等移入技术栈表格。保留以下版本说明：

```html
<p align="center">
  <strong>PayloadX v1.0 · 第二版界面（UI V2）</strong><br/>
  <sub>第二轮视觉与交互优化，不等同于路线图中的产品 v2.0。</sub>
</p>
```

将“界面预览”占位表格替换为真实图片链接。

- [x] **Step 3: 更新变更记录并检查 Markdown 链接**

在 `CHANGELOG.md` 的 v1.0 条目中记录：查询正确性、上传安全、任务事务、UI V2 响应式和原生验收。运行：

```powershell
$links = rg -o 'docs/assets/[^)" ]+' README.md
$links | ForEach-Object { if (-not (Test-Path -LiteralPath $_)) { throw "Missing asset: $_" } }
git diff --check
```

Expected: 所有本地资产存在，diff 无空白错误。

- [x] **Step 4: 提交文档视觉更新**

Run:

```powershell
git add README.md CHANGELOG.md docs/assets
git commit -m "docs: present PayloadX UI V2 with real screenshots"
```

Expected: README 顶部更克制，第二版含义清晰。

### Task 9: 原生全栈逐接口与逐页验收

**Files:**
- Create: `docs/VALIDATION-V2.md`
- Modify: `README.md`（仅在命令与真实运行不一致时）

- [x] **Step 1: 使用隔离验收数据启动后端**

Run in a hidden background process:

```powershell
$env:DATABASE_URL='sqlite:///./data/payloadx-validation.db'
$env:UPLOAD_DIR='./uploads/validation'
Start-Process -WindowStyle Hidden -FilePath '.\backend\.venv\Scripts\python.exe' -WorkingDirectory '.\backend' -ArgumentList @('-m','uvicorn','app.main:app','--host','127.0.0.1','--port','8001') -RedirectStandardOutput '.codex-api.log' -RedirectStandardError '.codex-api.err.log'
```

Expected: `GET http://127.0.0.1:8001/api/v1/health` 返回 200。

- [x] **Step 2: 启动前端开发服务并完成接口闭环**

Run:

```powershell
Start-Process -WindowStyle Hidden -FilePath 'npm.cmd' -WorkingDirectory (Get-Location) -ArgumentList @('run','dev') -RedirectStandardOutput '.codex-vite.log' -RedirectStandardError '.codex-vite.err.log'
```

通过真实 HTTP 依次验证 health、dashboard、tasks、sessions、payloads、alerts、logs、stats/protocols、settings；上传演示 PCAP 并轮询到 completed，核对会话/载荷/告警关联。

- [x] **Step 3: 验证负面输入**

实际提交错误扩展名、PCAPNG 魔数、截断 PCAP 和超过测试上限的文件，断言 400/413/422、可理解错误消息和无残留临时文件。重新解析活动任务断言 409。

- [x] **Step 4: 逐页与五档响应式验收**

访问 `/`、`/capture`、`/payloads`、载荷详情、`/protocols`、`/stats`、`/features`、`/alerts`、`/settings`、`/logs`、`/help` 和任务详情；记录每页加载、空、错误、操作和控制台结果。五档视口全部检查根溢出与交互。

- [x] **Step 5: 验证生产构建预览**

Run:

```powershell
npm run build
Start-Process -WindowStyle Hidden -FilePath 'npm.cmd' -WorkingDirectory (Get-Location) -ArgumentList @('run','preview','--','--host','127.0.0.1','--port','4173') -RedirectStandardOutput '.codex-preview.log' -RedirectStandardError '.codex-preview.err.log'
```

Expected: `http://127.0.0.1:4173` 可加载，代理到 8001 的关键读取和详情流程正常。

- [x] **Step 6: 写真实验收报告**

`docs/VALIDATION-V2.md` 必须包含：

- 环境与原生命令（明确 Docker 未使用且本机不可用）。
- 问题清单和 P0/P1/P2/P3 分级。
- 每项实际修改及对应文件。
- 自动测试、Lint、构建、接口和页面结果，含数量与命令。
- 375/768/1024/1440/1920 视口结果。
- 剩余 v1.0 已知边界。
- 功能、可靠性、安全、性能、UI/UX、可维护性各 10 分制评分与依据。

- [x] **Step 7: 提交验收报告**

Run:

```powershell
git add docs/VALIDATION-V2.md README.md
git commit -m "docs: record native UI V2 acceptance results"
```

Expected: 报告内容只包含真实执行结果。

### Task 10: 最终回归、审计、提交与推送

**Files:**
- Verify: entire repository

- [x] **Step 1: 从当前锁文件执行最终自动回归**

Run:

```powershell
npm ci
npm test
npm run lint
npm run build
Push-Location backend
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m ruff check app tests
Pop-Location
```

Expected: 全部命令 exit code 0。

- [x] **Step 2: 做敏感信息和占位内容审计**

Run:

```powershell
rg -n --hidden --glob '!.git/**' --glob '!node_modules/**' --glob '!backend/.venv/**' '(TODO|FIXME|TBD|sk-[A-Za-z0-9]|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|33185|C:\\Users\\)' .
git diff --check
git status --short
```

Expected: 无密钥、私钥、本机绝对路径或未完成占位；仅预期项目文件有改动。

- [x] **Step 3: 检查完整提交和远端关系**

Run:

```powershell
git log --oneline --decorate -10
git diff origin/codex/ui-overall-optimization...HEAD --stat
git remote get-url origin
```

Expected: 所有任务均有提交，远端 URL 为 `https://github.com/ibi6/-.git`。

- [ ] **Step 4: 推送当前分支**

Run:

```powershell
git push origin codex/ui-overall-optimization
```

Expected: 推送成功，远端分支包含全部第二版优化与验收提交。
