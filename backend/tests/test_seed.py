from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.entities import CaptureTask
from app.services import seed as seed_mod


def test_seed_uses_configured_upload_directory(tmp_path: Path, monkeypatch: pytest.MonkeyPatch):
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    Base.metadata.create_all(bind=engine)
    session_factory = sessionmaker(bind=engine, autoflush=False, autocommit=False)
    configured = tmp_path / "configured-seed"
    monkeypatch.setattr(
        seed_mod,
        "get_settings",
        lambda: SimpleNamespace(upload_path=configured),
        raising=False,
    )
    monkeypatch.setattr(seed_mod, "run_parse_task", lambda _task_id: None)

    with session_factory() as db:
        seed_mod.seed_if_empty(db)
        task = db.scalar(select(CaptureTask))

    assert (configured / "demo_http_dns.pcap").is_file()
    assert Path(task.file_path).parent == configured
