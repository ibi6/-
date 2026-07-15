from __future__ import annotations

import json
import struct
from datetime import datetime
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import UPLOAD_DIR
from app.models.entities import CaptureTask, OpLog, SystemConfig
from app.services.task_runner import run_parse_task, write_log


def _build_demo_pcap(path: Path) -> None:
    """构造最小可解析 PCAP：HTTP GET + DNS query。"""
    packets: list[bytes] = []

    def eth_ip_tcp(src_ip: bytes, dst_ip: bytes, sport: int, dport: int, payload: bytes, seq: int = 1) -> bytes:
        # Ethernet
        eth = b"\x00" * 6 + b"\x11" * 6 + b"\x08\x00"
        # IPv4
        total_len = 20 + 20 + len(payload)
        ip = bytearray(20)
        ip[0] = 0x45
        struct.pack_into("!H", ip, 2, total_len)
        ip[8] = 64
        ip[9] = 6  # TCP
        ip[12:16] = src_ip
        ip[16:20] = dst_ip
        # TCP
        tcp = bytearray(20)
        struct.pack_into("!HH", tcp, 0, sport, dport)
        struct.pack_into("!I", tcp, 4, seq)
        tcp[12] = 0x50  # data offset 5
        tcp[13] = 0x18  # PSH+ACK
        struct.pack_into("!H", tcp, 14, 8192)
        return bytes(eth + ip + tcp + payload)

    def eth_ip_udp(src_ip: bytes, dst_ip: bytes, sport: int, dport: int, payload: bytes) -> bytes:
        eth = b"\x00" * 6 + b"\x11" * 6 + b"\x08\x00"
        total_len = 20 + 8 + len(payload)
        ip = bytearray(20)
        ip[0] = 0x45
        struct.pack_into("!H", ip, 2, total_len)
        ip[8] = 64
        ip[9] = 17
        ip[12:16] = src_ip
        ip[16:20] = dst_ip
        udp = bytearray(8)
        struct.pack_into("!HH", udp, 0, sport, dport)
        struct.pack_into("!H", udp, 4, 8 + len(payload))
        return bytes(eth + ip + udp + payload)

    http_req = (
        b"POST /api/v1/login HTTP/1.1\r\n"
        b"Host: api.campus.edu\r\n"
        b"Content-Type: application/json\r\n"
        b"Content-Length: 48\r\n"
        b"\r\n"
        b'{"username":"student","password":"secret123"}'
    )
    http_resp = (
        b"HTTP/1.1 200 OK\r\n"
        b"Content-Type: application/json\r\n"
        b"Content-Length: 40\r\n"
        b"\r\n"
        b'{"code":0,"token":"demo-jwt-token"}'
    )
    # DNS query for portal.campus.edu
    dns = bytearray()
    dns += struct.pack("!HHHHHH", 0x1234, 0x0100, 1, 0, 0, 0)
    for label in b"portal.campus.edu".split(b"."):
        dns.append(len(label))
        dns += label
    dns.append(0)
    dns += struct.pack("!HH", 1, 1)  # A IN

    sip = bytes([10, 12, 8, 44])
    dip = bytes([203, 0, 113, 45])
    packets.append(eth_ip_tcp(sip, dip, 52318, 80, http_req, 1000))
    packets.append(eth_ip_tcp(dip, sip, 80, 52318, http_resp, 2000))
    packets.append(eth_ip_udp(sip, bytes([8, 8, 8, 8]), 53000, 53, bytes(dns)))

    # classic PCAP little-endian
    gh = struct.pack("<IHHIIII", 0xA1B2C3D4, 2, 4, 0, 0, 65535, 1)
    body = bytearray(gh)
    ts = int(datetime.utcnow().timestamp())
    for i, pkt in enumerate(packets):
        body += struct.pack("<IIII", ts, i * 1000, len(pkt), len(pkt))
        body += pkt
    path.write_bytes(body)


def seed_if_empty(db: Session) -> None:
    has = db.scalar(select(CaptureTask.id).limit(1))
    if has:
        return

    defaults = {
        "max_upload_mb": "512",
        "auto_extract": "true",
        "deep_inspection": "true",
        "retain_days": "30",
        "hex_columns": "16",
        "storage_path": "./uploads",
        "enabled_protocols": "HTTP,HTTPS,DNS,TLS,TCP,UDP,MQTT,WebSocket,FTP,SMTP",
    }
    for k, v in defaults.items():
        db.merge(SystemConfig(key=k, value=v))

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    demo_path = UPLOAD_DIR / "demo_http_dns.pcap"
    if not demo_path.exists():
        _build_demo_pcap(demo_path)

    task = CaptureTask(
        name="演示样本 · HTTP+DNS",
        filename=demo_path.name,
        file_path=str(demo_path),
        file_size=demo_path.stat().st_size,
        status="pending",
        progress=0,
    )
    db.add(task)
    write_log(db, "system", "初始化演示 PCAP 与默认配置")
    db.commit()
    db.refresh(task)
    run_parse_task(task.id)
