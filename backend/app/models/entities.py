from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class CaptureTask(Base):
    __tablename__ = "capture_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), default="")
    file_size: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    progress: Mapped[int] = mapped_column(Integer, default=0)
    packet_count: Mapped[int] = mapped_column(Integer, default=0)
    session_count: Mapped[int] = mapped_column(Integer, default=0)
    payload_count: Mapped[int] = mapped_column(Integer, default=0)
    protocols: Mapped[str] = mapped_column(String(255), default="")  # comma-separated
    error_message: Mapped[str | None] = mapped_column(Text)
    duration_ms: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    finished_at: Mapped[datetime | None] = mapped_column(DateTime)

    sessions: Mapped[list[FlowSession]] = relationship(back_populates="task", cascade="all, delete-orphan")
    payloads: Mapped[list[Payload]] = relationship(back_populates="task", cascade="all, delete-orphan")
    alerts: Mapped[list[Alert]] = relationship(back_populates="task", cascade="all, delete-orphan")


class FlowSession(Base):
    __tablename__ = "flow_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("capture_tasks.id"), index=True)
    src_ip: Mapped[str] = mapped_column(String(64), default="")
    src_port: Mapped[int] = mapped_column(Integer, default=0)
    dst_ip: Mapped[str] = mapped_column(String(64), default="")
    dst_port: Mapped[int] = mapped_column(Integer, default=0)
    protocol: Mapped[str] = mapped_column(String(20), default="TCP", index=True)
    application: Mapped[str] = mapped_column(String(80), default="")
    packets: Mapped[int] = mapped_column(Integer, default=0)
    bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    payload_bytes: Mapped[int] = mapped_column(BigInteger, default=0)
    status: Mapped[str] = mapped_column(String(20), default="closed")
    start_time: Mapped[datetime | None] = mapped_column(DateTime)
    end_time: Mapped[datetime | None] = mapped_column(DateTime)

    task: Mapped[CaptureTask] = relationship(back_populates="sessions")
    payloads: Mapped[list[Payload]] = relationship(back_populates="session", cascade="all, delete-orphan")


class Payload(Base):
    __tablename__ = "payloads"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int] = mapped_column(ForeignKey("capture_tasks.id"), index=True)
    session_id: Mapped[int | None] = mapped_column(ForeignKey("flow_sessions.id"), index=True)
    payload_type: Mapped[str] = mapped_column(String(20), default="binary", index=True)
    protocol: Mapped[str] = mapped_column(String(20), default="", index=True)
    application: Mapped[str] = mapped_column(String(80), default="")
    content_type: Mapped[str] = mapped_column(String(120), default="")
    size: Mapped[int] = mapped_column(Integer, default=0)
    summary: Mapped[str] = mapped_column(String(255), default="")
    preview: Mapped[str] = mapped_column(Text, default="")
    hex_sample: Mapped[str] = mapped_column(Text, default="")
    ascii_sample: Mapped[str] = mapped_column(Text, default="")
    metadata_json: Mapped[str] = mapped_column(Text, default="{}")
    tags: Mapped[str] = mapped_column(String(255), default="")
    severity: Mapped[str] = mapped_column(String(20), default="info")
    timestamp: Mapped[datetime | None] = mapped_column(DateTime)

    task: Mapped[CaptureTask] = relationship(back_populates="payloads")
    session: Mapped[FlowSession | None] = relationship(back_populates="payloads")


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    task_id: Mapped[int | None] = mapped_column(ForeignKey("capture_tasks.id"), index=True)
    level: Mapped[str] = mapped_column(String(20), default="info", index=True)
    title: Mapped[str] = mapped_column(String(120), default="")
    detail: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(String(20), default="open", index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    task: Mapped[CaptureTask | None] = relationship(back_populates="alerts")


class OpLog(Base):
    __tablename__ = "op_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    module: Mapped[str] = mapped_column(String(50), default="system")
    level: Mapped[str] = mapped_column(String(20), default="INFO")
    message: Mapped[str] = mapped_column(String(500), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class SystemConfig(Base):
    __tablename__ = "system_config"

    key: Mapped[str] = mapped_column(String(50), primary_key=True)
    value: Mapped[str] = mapped_column(String(500), default="")
