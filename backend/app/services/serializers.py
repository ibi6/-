from __future__ import annotations

import json
from datetime import datetime

from app.models.entities import Alert, CaptureTask, FlowSession, OpLog, Payload
from app.schemas.common import AlertOut, LogOut, PayloadOut, SessionOut, TaskOut


def _split_csv(s: str | None) -> list[str]:
    if not s:
        return []
    return [x for x in s.split(",") if x]


def task_out(t: CaptureTask) -> TaskOut:
    return TaskOut(
        id=t.id,
        name=t.name,
        filename=t.filename,
        file_size=t.file_size,
        status=t.status,
        progress=t.progress,
        packet_count=t.packet_count,
        session_count=t.session_count,
        payload_count=t.payload_count,
        protocols=_split_csv(t.protocols),
        error_message=t.error_message,
        duration_ms=t.duration_ms or 0,
        created_at=t.created_at,
        finished_at=t.finished_at,
    )


def session_out(s: FlowSession, payload_ids: list[int] | None = None) -> SessionOut:
    return SessionOut(
        id=s.id,
        task_id=s.task_id,
        src_ip=s.src_ip,
        src_port=s.src_port,
        dst_ip=s.dst_ip,
        dst_port=s.dst_port,
        protocol=s.protocol,
        application=s.application,
        packets=s.packets,
        bytes=s.bytes,
        payload_bytes=s.payload_bytes,
        status=s.status,
        start_time=s.start_time,
        end_time=s.end_time,
        payload_ids=payload_ids or [],
    )


def payload_out(p: Payload) -> PayloadOut:
    try:
        meta = json.loads(p.metadata_json or "{}")
    except json.JSONDecodeError:
        meta = {}
    return PayloadOut(
        id=p.id,
        task_id=p.task_id,
        session_id=p.session_id,
        type=p.payload_type,
        protocol=p.protocol,
        application=p.application,
        content_type=p.content_type,
        size=p.size,
        summary=p.summary,
        preview=p.preview,
        hex_sample=p.hex_sample,
        ascii_sample=p.ascii_sample,
        metadata=meta,
        tags=_split_csv(p.tags),
        severity=p.severity,
        timestamp=p.timestamp,
    )


def alert_out(a: Alert) -> AlertOut:
    return AlertOut(
        id=a.id,
        task_id=a.task_id,
        level=a.level,
        title=a.title,
        detail=a.detail,
        status=a.status,
        created_at=a.created_at,
    )


def log_out(x: OpLog) -> LogOut:
    return LogOut(
        id=x.id,
        module=x.module,
        level=x.level,
        message=x.message,
        created_at=x.created_at,
    )


def iso(dt: datetime | None) -> str | None:
    return dt.isoformat() if dt else None
