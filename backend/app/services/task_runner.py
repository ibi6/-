from __future__ import annotations

import json
import threading
import time
import traceback
from datetime import datetime
from pathlib import Path

from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.models.entities import Alert, CaptureTask, FlowSession, OpLog, Payload
from app.services.pcap_parser import parse_pcap_file


def write_log(db: Session, module: str, message: str, level: str = "INFO") -> None:
    db.add(OpLog(module=module, level=level, message=message))


def run_parse_task(task_id: int) -> None:
    """Background parse entrypoint."""
    db = SessionLocal()
    try:
        task = db.get(CaptureTask, task_id)
        if not task:
            return
        task.status = "parsing"
        task.progress = 5
        write_log(db, "parse", f"开始解析任务 #{task_id} · {task.filename}")
        db.commit()

        path = task.file_path
        if not path or not Path(path).exists():
            task.status = "failed"
            task.error_message = "上传文件不存在"
            task.progress = 0
            write_log(db, "parse", task.error_message, "ERROR")
            db.commit()
            return

        t0 = time.time()
        task.status = "extracting"
        task.progress = 35
        db.commit()

        result = parse_pcap_file(path)

        task.progress = 70
        db.commit()

        # clear old children if re-run
        db.query(Payload).filter(Payload.task_id == task_id).delete()
        db.query(FlowSession).filter(FlowSession.task_id == task_id).delete()
        db.query(Alert).filter(Alert.task_id == task_id).delete()
        db.flush()

        key_to_session_id: dict[str, int] = {}
        for s in result.sessions:
            row = FlowSession(
                task_id=task_id,
                src_ip=s["src_ip"],
                src_port=s["src_port"],
                dst_ip=s["dst_ip"],
                dst_port=s["dst_port"],
                protocol=s["protocol"],
                application=s["application"],
                packets=s["packets"],
                bytes=s["bytes"],
                payload_bytes=s["payload_bytes"],
                status=s["status"],
                start_time=s["start_time"],
                end_time=s["end_time"],
            )
            db.add(row)
            db.flush()
            key_to_session_id[s["stream_key"]] = row.id

        for p in result.payloads:
            row = Payload(
                task_id=task_id,
                session_id=key_to_session_id.get(p["stream_key"]),
                payload_type=p["payload_type"],
                protocol=p["protocol"],
                application=p["application"],
                content_type=p["content_type"],
                size=p["size"],
                summary=p["summary"],
                preview=p["preview"],
                hex_sample=p["hex_sample"],
                ascii_sample=p["ascii_sample"],
                metadata_json=json.dumps(p["metadata"], ensure_ascii=False),
                tags=",".join(p["tags"]),
                severity=p["severity"],
                timestamp=p["timestamp"],
            )
            db.add(row)

        for a in result.alerts:
            db.add(
                Alert(
                    task_id=task_id,
                    level=a["level"],
                    title=a["title"],
                    detail=a["detail"],
                    status="open",
                )
            )

        elapsed = int((time.time() - t0) * 1000)
        task.packet_count = result.packet_count
        task.session_count = len(result.sessions)
        task.payload_count = len(result.payloads)
        task.protocols = ",".join(result.protocols)
        task.status = "completed"
        task.progress = 100
        task.duration_ms = elapsed
        task.finished_at = datetime.utcnow()
        task.error_message = None
        write_log(
            db,
            "parse",
            f"任务 #{task_id} 完成：包 {task.packet_count} / 会话 {task.session_count} / 载荷 {task.payload_count}",
        )
        db.commit()
    except Exception as exc:  # noqa: BLE001
        db.rollback()
        task = db.get(CaptureTask, task_id)
        if task:
            task.status = "failed"
            task.progress = 0
            task.error_message = str(exc)[:500]
            write_log(db, "parse", f"任务 #{task_id} 失败：{exc}", "ERROR")
            write_log(db, "parse", traceback.format_exc()[-400:], "ERROR")
            db.commit()
    finally:
        db.close()


def start_parse_async(task_id: int) -> None:
    th = threading.Thread(target=run_parse_task, args=(task_id,), daemon=True)
    th.start()
