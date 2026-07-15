from __future__ import annotations

import shutil
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR, get_settings
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
    status: str | None = None,
    q: str | None = None,
    db: Session = Depends(get_db),
) -> list[TaskOut]:
    stmt = select(CaptureTask).order_by(CaptureTask.id.desc())
    if status and status != "all":
        stmt = stmt.where(CaptureTask.status == status)
    tasks = list(db.scalars(stmt).all())
    if q:
        ql = q.lower()
        tasks = [t for t in tasks if ql in t.name.lower() or ql in t.filename.lower() or ql in str(t.id)]
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
    name: str | None = None,
    db: Session = Depends(get_db),
) -> TaskOut:
    filename = file.filename or "capture.pcap"
    lower = filename.lower()
    if not (lower.endswith(".pcap") or lower.endswith(".cap")):
        if lower.endswith(".pcapng"):
            raise HTTPException(400, "当前版本请将 PCAPNG 另存为经典 PCAP 后再上传")
        raise HTTPException(400, "仅支持 .pcap / .cap 文件")

    data = await file.read()
    max_bytes = settings.max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(400, f"文件超过 {settings.max_upload_mb}MB 限制")
    if len(data) < 24:
        raise HTTPException(400, "文件过小，不是有效 PCAP")

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe = f"{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_{Path(filename).name}"
    dest = UPLOAD_DIR / safe
    dest.write_bytes(data)

    task = CaptureTask(
        name=name or Path(filename).stem,
        filename=filename,
        file_path=str(dest),
        file_size=len(data),
        status="pending",
        progress=0,
    )
    db.add(task)
    write_log(db, "upload", f"上传文件 {filename} ({len(data)} bytes)")
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
    protocol: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=2000),
    db: Session = Depends(get_db),
) -> list[SessionOut]:
    stmt = select(FlowSession).order_by(FlowSession.id.desc()).limit(limit)
    if task_id is not None:
        stmt = select(FlowSession).where(FlowSession.task_id == task_id).order_by(FlowSession.id.desc()).limit(limit)
    sessions = list(db.scalars(stmt).all())
    if protocol and protocol != "all":
        sessions = [s for s in sessions if s.protocol == protocol]
    if q:
        ql = q.lower()
        sessions = [
            s
            for s in sessions
            if ql in s.src_ip.lower()
            or ql in s.dst_ip.lower()
            or ql in (s.application or "").lower()
            or ql in str(s.id)
        ]

    # payload ids
    out: list[SessionOut] = []
    for s in sessions:
        pids = list(db.scalars(select(Payload.id).where(Payload.session_id == s.id)).all())
        out.append(session_out(s, pids))
    return out


@router.get("/payloads", response_model=list[PayloadOut])
def list_payloads(
    task_id: int | None = None,
    session_id: int | None = None,
    type: str | None = None,
    q: str | None = None,
    limit: int = Query(200, ge=1, le=2000),
    db: Session = Depends(get_db),
) -> list[PayloadOut]:
    stmt = select(Payload).order_by(Payload.id.desc()).limit(limit)
    if task_id is not None:
        stmt = select(Payload).where(Payload.task_id == task_id).order_by(Payload.id.desc()).limit(limit)
    if session_id is not None:
        stmt = select(Payload).where(Payload.session_id == session_id).order_by(Payload.id.desc()).limit(limit)
    items = list(db.scalars(stmt).all())
    if type and type != "all":
        items = [p for p in items if p.payload_type == type]
    if q:
        ql = q.lower()
        items = [
            p
            for p in items
            if ql in (p.summary or "").lower()
            or ql in (p.tags or "").lower()
            or ql in str(p.id)
            or ql in (p.protocol or "").lower()
        ]
    return [payload_out(p) for p in items]


@router.get("/payloads/{payload_id}", response_model=PayloadOut)
def get_payload(payload_id: int, db: Session = Depends(get_db)) -> PayloadOut:
    p = db.get(Payload, payload_id)
    if not p:
        raise HTTPException(404, "载荷不存在")
    return payload_out(p)


@router.get("/alerts", response_model=list[AlertOut])
def list_alerts(
    level: str | None = None,
    status: str | None = "open",
    db: Session = Depends(get_db),
) -> list[AlertOut]:
    stmt = select(Alert).order_by(Alert.id.desc())
    if status and status != "all":
        stmt = stmt.where(Alert.status == status)
    items = list(db.scalars(stmt).all())
    if level and level != "all":
        items = [a for a in items if a.level == level]
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
