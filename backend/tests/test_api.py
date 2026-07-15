from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.api import routes as routes_mod
from app.db.session import Base, get_db
from app.main import app
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
    monkeypatch.setattr(routes_mod, "UPLOAD_DIR", upload_dir)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


def test_health(client: TestClient):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


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
