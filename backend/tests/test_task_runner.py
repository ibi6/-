import threading
from pathlib import Path
from types import SimpleNamespace

import pytest
from sqlalchemy import create_engine, func, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.session import Base
from app.models.entities import CaptureTask, FlowSession, OpLog
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


def test_failed_reparse_keeps_previous_evidence_and_hides_traceback(
    db_factory,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
):
    capture_path = tmp_path / "case.pcap"
    capture_path.write_bytes(b"existing capture")
    with db_factory() as db:
        task = CaptureTask(
            name="case",
            filename="case.pcap",
            file_path=str(capture_path),
            status="completed",
        )
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
        task = db.get(CaptureTask, task_id)
        messages = list(db.scalars(select(OpLog.message)).all())
        assert db.scalar(select(func.count()).select_from(FlowSession)) == 1
        assert task.status == "failed"
        assert task.error_message == "解析失败，请检查 PCAP 文件格式或服务日志"
        assert all("Traceback" not in message and "task_runner.py" not in message for message in messages)


def test_start_parse_async_deduplicates_active_task(monkeypatch: pytest.MonkeyPatch):
    started = threading.Event()
    release = threading.Event()

    def blocking_run(_task_id: int) -> None:
        started.set()
        release.wait(timeout=2)

    monkeypatch.setattr(task_runner, "run_parse_task", blocking_run)

    try:
        assert task_runner.start_parse_async(42) is True
        assert started.wait(timeout=1)
        assert task_runner.start_parse_async(42) is False
    finally:
        release.set()
