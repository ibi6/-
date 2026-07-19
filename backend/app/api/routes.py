from __future__ import annotations

from datetime import datetime
from pathlib import Path
from uuid import uuid4

import aiofiles
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models.entities import Alert, CaptureTask, FlowSession, OpLog, Payload, SystemConfig
from app.schemas.common import (
    AlertOut,
    DashboardOut,
    LogOut,
    Message,
    PayloadOut,
    ProtocolStatOut,
    SessionOut,
    SettingsOut,
    TaskOut,
)
from app.services.serializers import alert_out, log_out, payload_out, session_out, task_out
from app.services.task_runner import start_parse_async, write_log

router = APIRouter(prefix="/api/v1")
settings = get_settings()
UPLOAD_CHUNK_BYTES = 1024 * 1024
PCAP_MAGIC_VALUES = {
    bytes.fromhex("d4c3b2a1"),
    bytes.fromhex("a1b2c3d4"),
    bytes.fromhex("4d3cb2a1"),
    bytes.fromhex("a1b23c4d"),
}


def _search_pattern(value: str | None) -> str | None:
    """Normalize a bounded user search into an escaped SQL LIKE pattern."""
    term = (value or "").strip().casefold()
    if not term:
        return None
    escaped = term.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped}%"


def _safe_upload_name(raw_name: str | None) -> str:
    """Strip client-supplied paths/control characters and cap the stored filename."""
    normalized = (raw_name or "capture.pcap").replace("\\", "/")
    filename = "".join(char for char in normalized.rsplit("/", 1)[-1] if char.isprintable()).strip()
    filename = filename or "capture.pcap"
    suffix = Path(filename).suffix
    stem = filename[: -len(suffix)] if suffix else filename
    return f"{stem[: 255 - len(suffix)]}{suffix}"


def _effective_max_upload_mb(db: Session) -> int:
    """Apply the saved UI limit without exceeding the process-level safety ceiling."""
    row = db.get(SystemConfig, "max_upload_mb")
    try:
        configured = int(row.value) if row else settings.max_upload_mb
    except (TypeError, ValueError):
        configured = settings.max_upload_mb
    return max(1, min(configured, settings.max_upload_mb))


def _upload_dir() -> Path:
    path = settings.upload_path
    path.mkdir(parents=True, exist_ok=True)
    return path


async def _persist_pcap_upload(file: UploadFile, destination: Path, max_bytes: int) -> int:
    """Validate the PCAP header and stream the upload to disk with bounded memory."""
    total = 0
    try:
        first_chunk = await file.read(UPLOAD_CHUNK_BYTES)
        if len(first_chunk) < 24:
            raise HTTPException(400, "文件过小，不是有效 PCAP")
        if first_chunk[:4] not in PCAP_MAGIC_VALUES:
            raise HTTPException(400, "文件头不是有效的经典 PCAP")
        total = len(first_chunk)
        if total > max_bytes:
            raise HTTPException(413, f"文件超过 {max_bytes // (1024 * 1024)}MB 限制")

        async with aiofiles.open(destination, "xb") as target:
            await target.write(first_chunk)
            while True:
                chunk = await file.read(UPLOAD_CHUNK_BYTES)
                if not chunk:
                    break
                total += len(chunk)
                if total > max_bytes:
                    raise HTTPException(413, f"文件超过 {max_bytes // (1024 * 1024)}MB 限制")
                await target.write(chunk)
        return total
    except Exception:
        destination.unlink(missing_ok=True)
        raise
    finally:
        await file.close()


@router.get("/health")
def health():
    return {"status": "ok", "app": settings.app_name}


@router.get("/dashboard", response_model=DashboardOut)
def dashboard(db: Session = Depends(get_db)) -> DashboardOut:
    tasks = list(db.scalars(select(CaptureTask).order_by(CaptureTask.id.desc()).limit(5)).all())
    payloads = list(db.scalars(select(Payload).order_by(Payload.id.desc()).limit(8)).all())
    alerts = list(db.scalars(select(Alert).order_by(Alert.id.desc()).limit(8)).all())

    packet_sum = db.scalar(select(func.coalesce(func.sum(CaptureTask.packet_count), 0))) or 0
    payload_sum = db.scalar(select(func.coalesce(func.sum(CaptureTask.payload_count), 0))) or 0
    anomaly = db.scalar(select(func.count()).select_from(Alert).where(Alert.status == "open")) or 0

    # protocol stats from sessions
    rows = db.execute(
        select(FlowSession.protocol, func.count(), func.coalesce(func.sum(FlowSession.bytes), 0)).group_by(
            FlowSession.protocol
        )
    ).all()
    total_c = sum(int(r[1]) for r in rows) or 1
    protocol_stats = [
        ProtocolStatOut(
            protocol=str(r[0] or "OTHER"),
            count=int(r[1]),
            bytes=int(r[2] or 0),
            percent=round(int(r[1]) * 100.0 / total_c, 1),
        )
        for r in rows
    ]
    protocol_stats.sort(key=lambda x: x.count, reverse=True)

    # simple timeline from tasks finished
    timeline = []
    for t in reversed(tasks):
        if t.created_at:
            timeline.append(
                {
                    "time": t.created_at.strftime("%H:%M"),
                    "packets": t.packet_count,
                    "payloads": t.payload_count,
                }
            )
    if not timeline:
        timeline = [{"time": "00:00", "packets": 0, "payloads": 0}]

    return DashboardOut(
        capture_total=int(packet_sum),
        payload_total=int(payload_sum),
        protocol_count=len(protocol_stats),
        anomaly_count=int(anomaly),
        uptime="运行中",
        capture_trend=5.2,
        payload_trend=3.1,
        protocol_trend=len(protocol_stats),
        anomaly_trend=-1.0,
        protocol_stats=protocol_stats,
        recent_tasks=[task_out(t) for t in tasks],
        recent_payloads=[payload_out(p) for p in payloads],
        recent_alerts=[alert_out(a) for a in alerts],
        timeline=timeline,
    )


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
    if pattern := _search_pattern(q):
        stmt = stmt.where(
            or_(
                func.lower(CaptureTask.name).like(pattern, escape="\\"),
                func.lower(CaptureTask.filename).like(pattern, escape="\\"),
                cast(CaptureTask.id, String).like(pattern, escape="\\"),
            )
        )
    stmt = stmt.order_by(CaptureTask.id.desc()).offset(offset).limit(limit)
    tasks = list(db.scalars(stmt).all())
    return [task_out(t) for t in tasks]


@router.get("/tasks/{task_id}", response_model=TaskOut)
def get_task(task_id: int, db: Session = Depends(get_db)) -> TaskOut:
    t = db.get(CaptureTask, task_id)
    if not t:
        raise HTTPException(404, "任务不存在")
    return task_out(t)


@router.post("/tasks/upload", response_model=TaskOut)
async def upload_task(
    file: UploadFile = File(...),
    name: str | None = Form(default=None, min_length=1, max_length=120),
    db: Session = Depends(get_db),
) -> TaskOut:
    filename = _safe_upload_name(file.filename)
    lower = filename.lower()
    if not (lower.endswith(".pcap") or lower.endswith(".cap")):
        if lower.endswith(".pcapng"):
            raise HTTPException(400, "当前版本请将 PCAPNG 另存为经典 PCAP 后再上传")
        raise HTTPException(400, "仅支持 .pcap / .cap 文件")

    upload_dir = _upload_dir()
    safe = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{uuid4().hex[:12]}_{filename}"
    dest = upload_dir / safe
    max_upload_mb = _effective_max_upload_mb(db)
    file_size = await _persist_pcap_upload(file, dest, max_upload_mb * 1024 * 1024)

    task = CaptureTask(
        name=(name or Path(filename).stem).strip() or Path(filename).stem,
        filename=filename,
        file_path=str(dest),
        file_size=file_size,
        status="pending",
        progress=0,
    )
    db.add(task)
    write_log(db, "upload", f"上传文件 {filename} ({file_size} bytes)")
    db.commit()
    db.refresh(task)
    start_parse_async(task.id)
    return task_out(task)


@router.post("/tasks/{task_id}/reparse", response_model=Message)
def reparse(task_id: int, db: Session = Depends(get_db)) -> Message:
    t = db.get(CaptureTask, task_id)
    if not t:
        raise HTTPException(404, "任务不存在")
    t.status = "pending"
    t.progress = 0
    t.error_message = None
    db.commit()
    start_parse_async(task_id)
    return Message(message="已重新入队解析", data={"task_id": task_id})


@router.get("/sessions", response_model=list[SessionOut])
def list_sessions(
    task_id: int | None = None,
    protocol: str | None = Query(default=None, max_length=20),
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[SessionOut]:
    stmt = select(FlowSession)
    if task_id is not None:
        stmt = stmt.where(FlowSession.task_id == task_id)
    if protocol and protocol != "all":
        stmt = stmt.where(func.lower(FlowSession.protocol) == protocol.strip().casefold())
    if pattern := _search_pattern(q):
        stmt = stmt.where(
            or_(
                func.lower(FlowSession.src_ip).like(pattern, escape="\\"),
                func.lower(FlowSession.dst_ip).like(pattern, escape="\\"),
                func.lower(FlowSession.application).like(pattern, escape="\\"),
                cast(FlowSession.id, String).like(pattern, escape="\\"),
            )
        )
    stmt = stmt.order_by(FlowSession.id.desc()).offset(offset).limit(limit)
    sessions = list(db.scalars(stmt).all())

    session_ids = [session.id for session in sessions]
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
    return [session_out(session, payload_ids_by_session[session.id]) for session in sessions]


@router.get("/payloads", response_model=list[PayloadOut])
def list_payloads(
    task_id: int | None = None,
    session_id: int | None = None,
    type: str | None = Query(default=None, max_length=20),
    q: str | None = Query(default=None, max_length=200),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[PayloadOut]:
    stmt = select(Payload)
    if task_id is not None:
        stmt = stmt.where(Payload.task_id == task_id)
    if session_id is not None:
        stmt = stmt.where(Payload.session_id == session_id)
    if type and type != "all":
        stmt = stmt.where(func.lower(Payload.payload_type) == type.strip().casefold())
    if pattern := _search_pattern(q):
        stmt = stmt.where(
            or_(
                func.lower(Payload.summary).like(pattern, escape="\\"),
                func.lower(Payload.tags).like(pattern, escape="\\"),
                func.lower(Payload.protocol).like(pattern, escape="\\"),
                cast(Payload.id, String).like(pattern, escape="\\"),
            )
        )
    stmt = stmt.order_by(Payload.id.desc()).offset(offset).limit(limit)
    items = list(db.scalars(stmt).all())
    return [payload_out(p) for p in items]


@router.get("/payloads/{payload_id}", response_model=PayloadOut)
def get_payload(payload_id: int, db: Session = Depends(get_db)) -> PayloadOut:
    p = db.get(Payload, payload_id)
    if not p:
        raise HTTPException(404, "载荷不存在")
    return payload_out(p)


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(
    level: str | None = Query(default=None, max_length=20),
    status: str | None = Query(default="open", max_length=20),
    limit: int = Query(200, ge=1, le=2000),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
) -> list[AlertOut]:
    stmt = select(Alert)
    if status and status != "all":
        stmt = stmt.where(Alert.status == status)
    if level and level != "all":
        stmt = stmt.where(Alert.level == level)
    items = list(db.scalars(stmt.order_by(Alert.id.desc()).offset(offset).limit(limit)).all())
    return [alert_out(a) for a in items]


@router.post("/alerts/{alert_id}/resolve", response_model=AlertOut)
def resolve_alert(alert_id: int, db: Session = Depends(get_db)) -> AlertOut:
    a = db.get(Alert, alert_id)
    if not a:
        raise HTTPException(404, "告警不存在")
    a.status = "resolved"
    db.commit()
    db.refresh(a)
    return alert_out(a)


@router.get("/logs", response_model=list[LogOut])
def list_logs(limit: int = Query(100, ge=1, le=500), db: Session = Depends(get_db)) -> list[LogOut]:
    rows = db.scalars(select(OpLog).order_by(OpLog.id.desc()).limit(limit)).all()
    return [log_out(x) for x in rows]


@router.get("/stats/protocols", response_model=list[ProtocolStatOut])
def protocol_stats(db: Session = Depends(get_db)) -> list[ProtocolStatOut]:
    rows = db.execute(
        select(FlowSession.protocol, func.count(), func.coalesce(func.sum(FlowSession.bytes), 0)).group_by(
            FlowSession.protocol
        )
    ).all()
    total = sum(int(r[1]) for r in rows) or 1
    stats = [
        ProtocolStatOut(
            protocol=str(r[0] or "OTHER"),
            count=int(r[1]),
            bytes=int(r[2] or 0),
            percent=round(int(r[1]) * 100.0 / total, 1),
        )
        for r in rows
    ]
    stats.sort(key=lambda x: x.count, reverse=True)
    return stats


@router.get("/settings", response_model=SettingsOut)
def get_settings_api(db: Session = Depends(get_db)) -> SettingsOut:
    def g(key: str, default: str = "") -> str:
        row = db.get(SystemConfig, key)
        return row.value if row else default

    enabled = g("enabled_protocols", "HTTP,HTTPS,DNS,TLS,TCP,UDP")
    return SettingsOut(
        max_upload_mb=int(g("max_upload_mb", str(settings.max_upload_mb))),
        auto_extract=g("auto_extract", "true").lower() == "true",
        deep_inspection=g("deep_inspection", "true").lower() == "true",
        retain_days=int(g("retain_days", "30")),
        hex_columns=int(g("hex_columns", "16")),
        storage_path=g("storage_path", "./uploads"),
        enabled_protocols=[x for x in enabled.split(",") if x],
    )


@router.put("/settings", response_model=SettingsOut)
def put_settings(body: SettingsOut, db: Session = Depends(get_db)) -> SettingsOut:
    mapping = {
        "max_upload_mb": str(body.max_upload_mb),
        "auto_extract": "true" if body.auto_extract else "false",
        "deep_inspection": "true" if body.deep_inspection else "false",
        "retain_days": str(body.retain_days),
        "hex_columns": str(body.hex_columns),
        "storage_path": body.storage_path,
        "enabled_protocols": ",".join(body.enabled_protocols),
    }
    for k, v in mapping.items():
        db.merge(SystemConfig(key=k, value=v))
    write_log(db, "system", "更新系统配置")
    db.commit()
    return body
