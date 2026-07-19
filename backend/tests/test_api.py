from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import routes as routes_mod
from app.api.routes import _safe_upload_name
from app.db.session import Base, get_db
from app.main import app
from app.models.entities import CaptureTask, SystemConfig
from app.services import task_runner
from app.services.seed import _build_demo_pcap


@pytest.fixture()
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    Base.metadata.create_all(bind=engine)

    monkeypatch.setattr(task_runner, "SessionLocal", TestingSessionLocal)

    # Inline parse (routes imported start_parse_async by name — patch there)
    def sync_parse(task_id: int) -> None:
        task_runner.run_parse_task(task_id)

    monkeypatch.setattr(routes_mod, "start_parse_async", sync_parse)

    upload_dir = tmp_path / "uploads"
    upload_dir.mkdir()
    monkeypatch.setattr(routes_mod.settings, "upload_dir", str(upload_dir))

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        c.app.state.testing_engine = engine
        c.app.state.testing_session_factory = TestingSessionLocal
        yield c
    app.dependency_overrides.clear()


def test_health(client: TestClient):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_dashboard_does_not_invent_trends(client: TestClient):
    data = client.get("/api/v1/dashboard").json()

    assert data["capture_trend"] == 0
    assert data["payload_trend"] == 0
    assert data["anomaly_trend"] == 0


def test_safe_upload_name_removes_control_characters_and_preserves_extension():
    assert _safe_upload_name("C:\\fakepath\\cap\r\nTURE.pcap") == "capTURE.pcap"
    normalized = _safe_upload_name(f"{'a' * 300}.pcap")
    assert len(normalized) <= 255
    assert normalized.endswith(".pcap")


def test_cors_allows_known_frontend_without_credentials(client: TestClient):
    r = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://127.0.0.1:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert r.status_code == 200
    assert r.headers["access-control-allow-origin"] == "http://127.0.0.1:5173"
    assert "access-control-allow-credentials" not in r.headers


def test_api_disables_sensitive_response_caching(client: TestClient):
    response = client.get("/api/v1/dashboard")

    assert response.status_code == 200
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "no-referrer"


def test_upload_and_list(client: TestClient, tmp_path: Path):
    pcap = tmp_path / "u.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as f:
        r = client.post(
            "/api/v1/tasks/upload",
            files={"file": ("u.pcap", f, "application/vnd.tcpdump.pcap")},
        )
    assert r.status_code == 200, r.text
    task = r.json()
    t = client.get(f"/api/v1/tasks/{task['id']}").json()
    assert t["status"] == "completed", t
    assert t["payload_count"] >= 1
    payloads = client.get("/api/v1/payloads").json()
    assert len(payloads) >= 1


def test_reparse_rejects_an_already_active_task(client: TestClient, tmp_path: Path):
    pcap = tmp_path / "active.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as stream:
        uploaded = client.post(
            "/api/v1/tasks/upload",
            files={"file": (pcap.name, stream, "application/vnd.tcpdump.pcap")},
        ).json()

    with client.app.state.testing_session_factory() as db:
        task = db.get(CaptureTask, uploaded["id"])
        task.status = "parsing"
        db.commit()

    response = client.post(f"/api/v1/tasks/{uploaded['id']}/reparse")

    assert response.status_code == 409
    assert response.json()["detail"] == "任务正在解析，请勿重复提交"


def test_upload_rejects_invalid_pcap_magic_and_cleans_file(client: TestClient, tmp_path: Path):
    r = client.post(
        "/api/v1/tasks/upload",
        files={"file": ("fake.pcap", b"not-a-pcap-file" * 4, "application/octet-stream")},
    )
    assert r.status_code == 400
    assert "PCAP" in r.json()["detail"]
    assert list((tmp_path / "uploads").iterdir()) == []


def test_upload_normalizes_untrusted_filename(client: TestClient, tmp_path: Path):
    pcap = tmp_path / "safe.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as f:
        r = client.post(
            "/api/v1/tasks/upload",
            files={"file": ("../escape.pcap", f, "application/vnd.tcpdump.pcap")},
        )
    assert r.status_code == 200, r.text
    assert r.json()["filename"] == "escape.pcap"


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

    assert response.status_code == 200, response.text
    assert configured.is_dir()
    assert [path.name for path in configured.iterdir()] != []


def test_task_list_enforces_limit_and_offset(client: TestClient, tmp_path: Path):
    for filename in ("alpha.pcap", "target.pcap"):
        pcap = tmp_path / filename
        _build_demo_pcap(pcap)
        with pcap.open("rb") as stream:
            response = client.post(
                "/api/v1/tasks/upload",
                files={"file": (filename, stream, "application/vnd.tcpdump.pcap")},
            )
        assert response.status_code == 200, response.text

    first_page = client.get("/api/v1/tasks", params={"limit": 1}).json()
    second_page = client.get("/api/v1/tasks", params={"limit": 1, "offset": 1}).json()

    assert [item["filename"] for item in first_page] == ["target.pcap"]
    assert [item["filename"] for item in second_page] == ["alpha.pcap"]


def test_session_and_payload_queries_filter_before_limit(client: TestClient, tmp_path: Path):
    pcap = tmp_path / "filter-order.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as stream:
        response = client.post(
            "/api/v1/tasks/upload",
            files={"file": (pcap.name, stream, "application/vnd.tcpdump.pcap")},
        )
    assert response.status_code == 200, response.text

    sessions = client.get("/api/v1/sessions", params={"q": "HTTP", "limit": 1})
    payloads = client.get("/api/v1/payloads", params={"q": "POST", "limit": 1})

    assert sessions.status_code == 200
    assert [item["application"] for item in sessions.json()] == ["HTTP"]
    assert payloads.status_code == 200
    assert [item["protocol"] for item in payloads.json()] == ["HTTP"]


def test_session_payload_ids_are_loaded_in_one_query(client: TestClient, tmp_path: Path):
    pcap = tmp_path / "query-count.pcap"
    _build_demo_pcap(pcap)
    with pcap.open("rb") as stream:
        response = client.post(
            "/api/v1/tasks/upload",
            files={"file": (pcap.name, stream, "application/vnd.tcpdump.pcap")},
        )
    assert response.status_code == 200, response.text

    statements: list[str] = []

    def record_select(_conn, _cursor, statement, _parameters, _context, _executemany):
        if statement.lstrip().upper().startswith("SELECT"):
            statements.append(statement)

    engine = client.app.state.testing_engine
    event.listen(engine, "before_cursor_execute", record_select)
    try:
        result = client.get("/api/v1/sessions")
    finally:
        event.remove(engine, "before_cursor_execute", record_select)

    assert result.status_code == 200
    assert len(result.json()) == 2
    assert len(statements) == 2


def test_list_query_rejects_invalid_bounds(client: TestClient):
    assert client.get("/api/v1/tasks", params={"limit": 0}).status_code == 422
    assert client.get("/api/v1/payloads", params={"limit": 2001}).status_code == 422
    assert client.get("/api/v1/sessions", params={"q": "x" * 201}).status_code == 422


@pytest.mark.parametrize(
    ("path", "params"),
    [
        ("/api/v1/tasks", {"status": "unknown"}),
        ("/api/v1/alerts", {"level": "urgent"}),
        ("/api/v1/alerts", {"status": "unknown"}),
        ("/api/v1/sessions", {"task_id": 0}),
        ("/api/v1/payloads", {"session_id": -1}),
    ],
)
def test_list_query_rejects_unknown_enums_and_non_positive_ids(
    client: TestClient,
    path: str,
    params: dict[str, object],
):
    assert client.get(path, params=params).status_code == 422


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/tasks/0",
        "/api/v1/tasks/0/reparse",
        "/api/v1/payloads/0",
        "/api/v1/alerts/0/resolve",
    ],
)
def test_resource_routes_require_positive_ids(client: TestClient, path: str):
    method = client.post if path.endswith(("/reparse", "/resolve")) else client.get
    assert method(path).status_code == 422


@pytest.mark.parametrize(
    "body",
    [
        {
            "max_upload_mb": 0,
            "auto_extract": True,
            "deep_inspection": True,
            "retain_days": 30,
            "hex_columns": 16,
            "storage_path": "./uploads",
            "enabled_protocols": ["HTTP"],
        },
        {
            "max_upload_mb": 128,
            "auto_extract": True,
            "deep_inspection": True,
            "retain_days": 30,
            "hex_columns": 12,
            "storage_path": "./uploads",
            "enabled_protocols": ["HTTP"],
        },
        {
            "max_upload_mb": 128,
            "auto_extract": True,
            "deep_inspection": True,
            "retain_days": 30,
            "hex_columns": 16,
            "storage_path": "./uploads",
            "enabled_protocols": ["UNKNOWN"],
        },
        {
            "max_upload_mb": 128,
            "auto_extract": True,
            "deep_inspection": True,
            "retain_days": 30,
            "hex_columns": 16,
            "storage_path": "./uploads",
            "enabled_protocols": ["MQTT"],
        },
    ],
)
def test_settings_reject_invalid_values(client: TestClient, body: dict[str, object]):
    r = client.put("/api/v1/settings", json=body)
    assert r.status_code == 422, r.text


def test_settings_report_runtime_storage_and_upload_ceiling(
    client: TestClient,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    runtime_uploads = tmp_path / "runtime-uploads"
    monkeypatch.setattr(routes_mod.settings, "upload_dir", str(runtime_uploads))
    monkeypatch.setattr(routes_mod.settings, "max_upload_mb", 32)

    current = client.get("/api/v1/settings").json()
    assert current["max_upload_mb"] == 32
    assert current["storage_path"] == str(runtime_uploads)

    attempted = {**current, "max_upload_mb": 128, "storage_path": "C:/untrusted-override"}
    response = client.put("/api/v1/settings", json=attempted)

    assert response.status_code == 200, response.text
    assert response.json()["max_upload_mb"] == 32
    assert response.json()["storage_path"] == str(runtime_uploads)
    assert client.get("/api/v1/settings").json()["storage_path"] == str(runtime_uploads)


def test_settings_filter_legacy_unsupported_protocols(client: TestClient):
    with client.app.state.testing_session_factory() as db:
        db.merge(
            SystemConfig(
                key="enabled_protocols",
                value="HTTP,MQTT,FTP,DNS,WebSocket,TCP",
            )
        )
        db.commit()

    response = client.get("/api/v1/settings")

    assert response.status_code == 200
    assert response.json()["enabled_protocols"] == ["HTTP", "DNS", "TCP"]
