from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

ProtocolName = Literal[
    "HTTP",
    "HTTPS",
    "DNS",
    "FTP",
    "SMTP",
    "TLS",
    "TCP",
    "UDP",
    "MQTT",
    "WebSocket",
]


class TaskOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    filename: str
    file_size: int
    status: str
    progress: int
    packet_count: int
    session_count: int
    payload_count: int
    protocols: list[str] = Field(default_factory=list)
    error_message: str | None = None
    duration_ms: int = 0
    created_at: datetime | None = None
    finished_at: datetime | None = None


class SessionOut(BaseModel):
    id: int
    task_id: int
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    protocol: str
    application: str
    packets: int
    bytes: int
    payload_bytes: int
    status: str
    start_time: datetime | None = None
    end_time: datetime | None = None
    payload_ids: list[int] = Field(default_factory=list)


class PayloadOut(BaseModel):
    id: int
    task_id: int
    session_id: int | None
    type: str
    protocol: str
    application: str
    content_type: str
    size: int
    summary: str
    preview: str
    hex_sample: str
    ascii_sample: str
    metadata: dict[str, Any] = Field(default_factory=dict)
    tags: list[str] = Field(default_factory=list)
    severity: str
    timestamp: datetime | None = None


class AlertOut(BaseModel):
    id: int
    task_id: int | None
    level: str
    title: str
    detail: str
    status: str
    created_at: datetime | None = None


class LogOut(BaseModel):
    id: int
    module: str
    level: str
    message: str
    created_at: datetime | None = None


class ProtocolStatOut(BaseModel):
    protocol: str
    count: int
    bytes: int
    percent: float


class DashboardOut(BaseModel):
    capture_total: int
    payload_total: int
    protocol_count: int
    anomaly_count: int
    uptime: str
    capture_trend: float = 0
    payload_trend: float = 0
    protocol_trend: int = 0
    anomaly_trend: float = 0
    protocol_stats: list[ProtocolStatOut] = Field(default_factory=list)
    recent_tasks: list[TaskOut] = Field(default_factory=list)
    recent_payloads: list[PayloadOut] = Field(default_factory=list)
    recent_alerts: list[AlertOut] = Field(default_factory=list)
    timeline: list[dict[str, Any]] = Field(default_factory=list)


class Message(BaseModel):
    message: str
    data: dict[str, Any] = Field(default_factory=dict)


class SettingsOut(BaseModel):
    max_upload_mb: int = Field(ge=1, le=512)
    auto_extract: bool
    deep_inspection: bool
    retain_days: int = Field(ge=1, le=365)
    hex_columns: Literal[8, 16, 32]
    storage_path: str = Field(min_length=1, max_length=260)
    enabled_protocols: list[ProtocolName] = Field(min_length=1)

    @field_validator("enabled_protocols")
    @classmethod
    def unique_protocols(cls, value: list[ProtocolName]) -> list[ProtocolName]:
        """Reject duplicates so persisted configuration remains deterministic."""
        if len(value) != len(set(value)):
            raise ValueError("enabled_protocols 不能重复")
        return value
