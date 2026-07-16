"""
纯标准库 PCAP 解析器（支持经典 PCAP，不依赖 Scapy）。
完成：以太网/IPv4/TCP/UDP 解码 → 五元组会话 → HTTP/DNS 应用载荷提取。
"""
from __future__ import annotations

import re
import socket
import struct
from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any


@dataclass
class ExtractedPayload:
    protocol: str
    application: str
    payload_type: str
    content_type: str
    size: int
    summary: str
    preview: str
    hex_sample: str
    ascii_sample: str
    metadata: dict[str, Any]
    tags: list[str]
    severity: str
    timestamp: datetime | None
    stream_key: str


@dataclass
class FlowAgg:
    src_ip: str
    src_port: int
    dst_ip: str
    dst_port: int
    protocol: str
    packets: int = 0
    bytes: int = 0
    payload_bytes: int = 0
    start_ts: float | None = None
    end_ts: float | None = None
    client_data: bytearray = field(default_factory=bytearray)
    server_data: bytearray = field(default_factory=bytearray)
    application: str = ""


@dataclass
class ParseResult:
    packet_count: int
    sessions: list[dict[str, Any]]
    payloads: list[dict[str, Any]]
    protocols: list[str]
    alerts: list[dict[str, Any]]
    protocol_bytes: dict[str, int]
    protocol_counts: dict[str, int]


def _ts_to_dt(ts: float | None) -> datetime | None:
    if ts is None:
        return None
    return datetime.fromtimestamp(ts, tz=UTC).replace(tzinfo=None)


def _hex_sample(data: bytes, limit: int = 96) -> str:
    return data[:limit].hex()


def _ascii_sample(data: bytes, limit: int = 200) -> str:
    return "".join(chr(b) if 32 <= b <= 126 else "." for b in data[:limit])


def _truncate_preview(text: str, limit: int = 2000) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n…(truncated)"


def _detect_severity(text: str) -> tuple[str, list[str]]:
    tags: list[str] = []
    severity = "info"
    low = text.lower()
    if any(k in low for k in ("password", "passwd", "pwd=", "authorization:")):
        tags.append("敏感字段")
        severity = "high"
    if "token" in low or "jwt" in low or "bearer " in low:
        tags.append("Token")
        if severity == "info":
            severity = "medium"
    if "cookie:" in low:
        tags.append("Cookie")
    return severity, tags


def parse_pcap_file(path: str, max_packets: int = 200_000) -> ParseResult:
    with open(path, "rb") as f:
        global_hdr = f.read(24)
        if len(global_hdr) < 24:
            raise ValueError("PCAP 文件过短或已损坏")

        magic = global_hdr[:4]
        if magic == b"\xd4\xc3\xb2\xa1":
            endian = "<"
        elif magic == b"\xa1\xb2\xc3\xd4":
            endian = ">"
        elif magic in (b"\x0a\x0d\x0d\x0a", b"\x4d\x3c\x2b\x1a"):
            raise ValueError("暂不支持 PCAPNG，请先用 Wireshark 另存为经典 PCAP")
        else:
            raise ValueError(f"无法识别的 PCAP 魔数: {magic.hex()}")

        # linktype at offset 20
        linktype = struct.unpack(endian + "I", global_hdr[20:24])[0]
        if linktype not in (1, 101, 113):  # ethernet, raw, linux sll
            # still try ethernet-like
            pass

        flows: dict[str, FlowAgg] = {}
        packet_count = 0

        while packet_count < max_packets:
            ph = f.read(16)
            if len(ph) < 16:
                break
            ts_sec, ts_usec, incl_len, _orig_len = struct.unpack(endian + "IIII", ph)
            data = f.read(incl_len)
            if len(data) < incl_len:
                break
            packet_count += 1
            ts = ts_sec + ts_usec / 1_000_000.0
            _ingest_frame(data, linktype, ts, flows)

    sessions: list[dict[str, Any]] = []
    payloads: list[dict[str, Any]] = []
    protocol_bytes: dict[str, int] = defaultdict(int)
    protocol_counts: dict[str, int] = defaultdict(int)
    alerts: list[dict[str, Any]] = []

    for key, flow in flows.items():
        app = flow.application or _guess_app(flow)
        flow.application = app
        proto_label = app if app in {"HTTP", "DNS", "HTTPS", "TLS", "MQTT"} else flow.protocol
        protocol_bytes[proto_label] += flow.bytes
        protocol_counts[proto_label] += 1

        sessions.append(
            {
                "stream_key": key,
                "src_ip": flow.src_ip,
                "src_port": flow.src_port,
                "dst_ip": flow.dst_ip,
                "dst_port": flow.dst_port,
                "protocol": flow.protocol if flow.protocol in {"TCP", "UDP"} else proto_label,
                "application": app,
                "packets": flow.packets,
                "bytes": flow.bytes,
                "payload_bytes": flow.payload_bytes,
                "status": "closed",
                "start_time": _ts_to_dt(flow.start_ts),
                "end_time": _ts_to_dt(flow.end_ts),
            }
        )

        extracted = _extract_from_flow(flow)
        for ep in extracted:
            payloads.append(
                {
                    "stream_key": key,
                    "protocol": ep.protocol,
                    "application": ep.application,
                    "payload_type": ep.payload_type,
                    "content_type": ep.content_type,
                    "size": ep.size,
                    "summary": ep.summary,
                    "preview": ep.preview,
                    "hex_sample": ep.hex_sample,
                    "ascii_sample": ep.ascii_sample,
                    "metadata": ep.metadata,
                    "tags": ep.tags,
                    "severity": ep.severity,
                    "timestamp": ep.timestamp,
                }
            )
            if ep.severity in {"high", "medium"}:
                alerts.append(
                    {
                        "level": ep.severity,
                        "title": "敏感载荷命中" if ep.severity == "high" else "关注载荷",
                        "detail": ep.summary[:200],
                    }
                )

    # large transfer alert
    for s in sessions:
        if s["payload_bytes"] >= 500_000:
            alerts.append(
                {
                    "level": "medium",
                    "title": "检测到较大载荷传输",
                    "detail": f"{s['src_ip']}:{s['src_port']} → {s['dst_ip']}:{s['dst_port']} · {s['payload_bytes']} bytes",
                }
            )

    protocols = sorted({s["protocol"] for s in sessions} | {p["protocol"] for p in payloads})
    return ParseResult(
        packet_count=packet_count,
        sessions=sessions,
        payloads=payloads,
        protocols=protocols,
        alerts=alerts,
        protocol_bytes=dict(protocol_bytes),
        protocol_counts=dict(protocol_counts),
    )


def _guess_app(flow: FlowAgg) -> str:
    ports = {flow.src_port, flow.dst_port}
    if 80 in ports or 8080 in ports or 8000 in ports:
        return "HTTP"
    if 443 in ports or 8443 in ports:
        return "HTTPS"
    if 53 in ports:
        return "DNS"
    if 1883 in ports or 8883 in ports:
        return "MQTT"
    if flow.protocol == "TCP":
        # peek data
        blob = bytes(flow.client_data[:16] + flow.server_data[:16])
        if blob.startswith(b"GET ") or blob.startswith(b"POST ") or blob.startswith(b"HTTP/"):
            return "HTTP"
        if len(blob) > 0 and blob[0] == 0x16:
            return "TLS"
    return flow.protocol


def _flow_key(sip: str, sport: int, dip: str, dport: int, proto: str) -> tuple[str, bool]:
    a = (sip, sport)
    b = (dip, dport)
    if a <= b:
        return f"{sip}:{sport}-{dip}:{dport}/{proto}", True
    return f"{dip}:{dport}-{sip}:{sport}/{proto}", False


def _ingest_frame(data: bytes, linktype: int, ts: float, flows: dict[str, FlowAgg]) -> None:
    try:
        if linktype == 101:  # raw IP
            ip_off = 0
        elif linktype == 113:  # linux cooked
            if len(data) < 16:
                return
            ip_off = 16
        else:  # ethernet
            if len(data) < 14:
                return
            ethertype = struct.unpack("!H", data[12:14])[0]
            ip_off = 14
            if ethertype == 0x8100:  # vlan
                if len(data) < 18:
                    return
                ethertype = struct.unpack("!H", data[16:18])[0]
                ip_off = 18
            if ethertype != 0x0800:
                return

        if len(data) < ip_off + 20:
            return
        ip = data[ip_off:]
        vihl = ip[0]
        version = vihl >> 4
        if version != 4:
            return
        ihl = (vihl & 0x0F) * 4
        if len(ip) < ihl:
            return
        total_len = struct.unpack("!H", ip[2:4])[0]
        proto = ip[9]
        src = socket.inet_ntoa(ip[12:16])
        dst = socket.inet_ntoa(ip[16:20])
        payload = ip[ihl:total_len] if total_len <= len(ip) else ip[ihl:]

        if proto == 6 and len(payload) >= 20:  # TCP
            sport, dport = struct.unpack("!HH", payload[0:4])
            doff = ((payload[12] >> 4) & 0xF) * 4
            tcp_payload = payload[doff:] if len(payload) >= doff else b""
            key, forward = _flow_key(src, sport, dst, dport, "TCP")
            flow = flows.get(key)
            if not flow:
                if forward:
                    flow = FlowAgg(src, sport, dst, dport, "TCP")
                else:
                    flow = FlowAgg(dst, dport, src, sport, "TCP")
                flows[key] = flow
            flow.packets += 1
            flow.bytes += len(data)
            flow.payload_bytes += len(tcp_payload)
            flow.start_ts = ts if flow.start_ts is None else min(flow.start_ts, ts)
            flow.end_ts = ts if flow.end_ts is None else max(flow.end_ts, ts)
            if tcp_payload:
                if (src, sport) == (flow.src_ip, flow.src_port):
                    if len(flow.client_data) < 64_000:
                        flow.client_data.extend(tcp_payload[: 64_000 - len(flow.client_data)])
                else:
                    if len(flow.server_data) < 64_000:
                        flow.server_data.extend(tcp_payload[: 64_000 - len(flow.server_data)])

        elif proto == 17 and len(payload) >= 8:  # UDP
            sport, dport = struct.unpack("!HH", payload[0:4])
            udp_len = struct.unpack("!H", payload[4:6])[0]
            udp_payload = payload[8:udp_len] if udp_len >= 8 else payload[8:]
            key, forward = _flow_key(src, sport, dst, dport, "UDP")
            flow = flows.get(key)
            if not flow:
                if forward:
                    flow = FlowAgg(src, sport, dst, dport, "UDP")
                else:
                    flow = FlowAgg(dst, dport, src, sport, "UDP")
                flows[key] = flow
            flow.packets += 1
            flow.bytes += len(data)
            flow.payload_bytes += len(udp_payload)
            flow.start_ts = ts if flow.start_ts is None else min(flow.start_ts, ts)
            flow.end_ts = ts if flow.end_ts is None else max(flow.end_ts, ts)
            if udp_payload and len(flow.client_data) < 16_000:
                # store both sides concatenated lightly
                if (src, sport) == (flow.src_ip, flow.src_port):
                    flow.client_data.extend(udp_payload[: 16_000 - len(flow.client_data)])
                else:
                    flow.server_data.extend(udp_payload[: 16_000 - len(flow.server_data)])
    except Exception:
        return


def _extract_from_flow(flow: FlowAgg) -> list[ExtractedPayload]:
    out: list[ExtractedPayload] = []
    key, _ = _flow_key(flow.src_ip, flow.src_port, flow.dst_ip, flow.dst_port, flow.protocol)
    ts = _ts_to_dt(flow.end_ts or flow.start_ts)

    # HTTP on client/server buffers
    for direction, blob in (("request", bytes(flow.client_data)), ("response", bytes(flow.server_data))):
        if not blob:
            continue
        if blob.startswith((b"GET ", b"POST ", b"PUT ", b"DELETE ", b"HEAD ", b"HTTP/")):
            text = blob.decode("utf-8", errors="replace")
            out.extend(_parse_http(text, blob, key, ts, direction))
            flow.application = "HTTP"

    # DNS
    if 53 in {flow.src_port, flow.dst_port} and flow.protocol == "UDP":
        for blob in (bytes(flow.client_data), bytes(flow.server_data)):
            if len(blob) >= 12:
                dns_p = _parse_dns(blob, key, ts)
                if dns_p:
                    out.append(dns_p)
                    flow.application = "DNS"

    # TLS ClientHello / binary
    for blob in (bytes(flow.client_data), bytes(flow.server_data)):
        if len(blob) > 5 and blob[0] == 0x16 and blob[1] == 0x03:
            out.append(
                ExtractedPayload(
                    protocol="TLS",
                    application="TLS Handshake",
                    payload_type="binary",
                    content_type="application/tls",
                    size=len(blob),
                    summary=f"TLS 记录 · {flow.src_ip}:{flow.src_port} → {flow.dst_ip}:{flow.dst_port}",
                    preview="TLS Handshake / Application Data (encrypted)\n无法在无密钥情况下还原明文应用载荷。",
                    hex_sample=_hex_sample(blob),
                    ascii_sample=_ascii_sample(blob),
                    metadata={"version_hint": f"0x{blob[1]:02x}{blob[2]:02x}", "sni": _extract_sni(blob) or ""},
                    tags=["TLS", "加密"],
                    severity="info",
                    timestamp=ts,
                    stream_key=key,
                )
            )
            flow.application = flow.application or "TLS"
            break

    # generic leftover
    if not out:
        blob = bytes(flow.client_data or flow.server_data)
        if blob:
            out.append(
                ExtractedPayload(
                    protocol=flow.protocol,
                    application=flow.application or flow.protocol,
                    payload_type="binary",
                    content_type="application/octet-stream",
                    size=len(blob),
                    summary=f"{flow.protocol} 载荷 · {flow.src_ip}:{flow.src_port} → {flow.dst_ip}:{flow.dst_port}",
                    preview=_ascii_sample(blob, 400),
                    hex_sample=_hex_sample(blob),
                    ascii_sample=_ascii_sample(blob),
                    metadata={"note": "未识别为已知应用协议，保留原始载荷样例"},
                    tags=[flow.protocol],
                    severity="info",
                    timestamp=ts,
                    stream_key=key,
                )
            )
    return out


def _parse_http(text: str, raw: bytes, key: str, ts: datetime | None, direction: str) -> list[ExtractedPayload]:
    results: list[ExtractedPayload] = []
    # split multiple messages roughly
    parts = re.split(r"(?=\n(?=(?:GET|POST|PUT|DELETE|HEAD|HTTP/)\s))", text)
    if len(parts) == 1:
        parts = [text]

    for part in parts:
        part = part.lstrip("\n")
        if not part.strip():
            continue
        lines = part.split("\r\n") if "\r\n" in part else part.split("\n")
        start = lines[0] if lines else ""
        headers: dict[str, str] = {}
        if "" in lines:
            idx = lines.index("")
            for h in lines[1:idx]:
                if ":" in h:
                    k, v = h.split(":", 1)
                    headers[k.strip().lower()] = v.strip()
        else:
            for h in lines[1:]:
                if ":" in h:
                    k, v = h.split(":", 1)
                    headers[k.strip().lower()] = v.strip()

        severity, tags = _detect_severity(part)
        tags = list(dict.fromkeys(["HTTP"] + tags))
        ctype = headers.get("content-type", "text/plain")
        ptype = "json" if "json" in ctype else "text"
        if "html" in ctype:
            ptype = "html"

        meta: dict[str, Any] = {"direction": direction, "start_line": start}
        if start.startswith("HTTP/"):
            meta["status_line"] = start
        else:
            bits = start.split()
            if len(bits) >= 2:
                meta["method"] = bits[0]
                meta["path"] = bits[1]
        if "host" in headers:
            meta["host"] = headers["host"]
        if "user-agent" in headers:
            meta["user_agent"] = headers["user-agent"][:120]

        summary = start[:120] if start else "HTTP 消息"
        preview = _truncate_preview(part)
        results.append(
            ExtractedPayload(
                protocol="HTTP",
                application="HTTP",
                payload_type=ptype,
                content_type=ctype,
                size=len(part.encode("utf-8", errors="ignore")),
                summary=summary,
                preview=preview,
                hex_sample=_hex_sample(raw if len(parts) == 1 else part.encode("utf-8", errors="ignore")),
                ascii_sample=_ascii_sample(part.encode("utf-8", errors="ignore")),
                metadata=meta,
                tags=tags,
                severity=severity,
                timestamp=ts,
                stream_key=key,
            )
        )
    return results


def _parse_dns(blob: bytes, key: str, ts: datetime | None) -> ExtractedPayload | None:
    try:
        if len(blob) < 12:
            return None
        # skip id/flags
        qdcount = struct.unpack("!H", blob[4:6])[0]
        if qdcount < 1:
            return None
        # parse QNAME
        i = 12
        labels = []
        while i < len(blob):
            ln = blob[i]
            if ln == 0:
                i += 1
                break
            if ln & 0xC0 == 0xC0:
                break
            i += 1
            labels.append(blob[i : i + ln].decode("utf-8", errors="ignore"))
            i += ln
        qname = ".".join(labels) if labels else "(unknown)"
        preview = f"DNS Query/Response\nQNAME: {qname}"
        return ExtractedPayload(
            protocol="DNS",
            application="DNS",
            payload_type="text",
            content_type="dns/message",
            size=len(blob),
            summary=f"DNS · {qname}",
            preview=preview,
            hex_sample=_hex_sample(blob),
            ascii_sample=_ascii_sample(blob),
            metadata={"qname": qname},
            tags=["DNS", "解析"],
            severity="info",
            timestamp=ts,
            stream_key=key,
        )
    except Exception:
        return None


def _extract_sni(data: bytes) -> str | None:
    # very small heuristic for TLS ClientHello SNI
    try:
        if b"\x00\x00" not in data:
            return None
        # find server_name extension content host
        idx = data.find(b"\x00\x00")
        # not robust; try regex-like host
        m = re.search(rb"[\x00-\x20]([a-zA-Z0-9][a-zA-Z0-9\-\.]{2,60}\.[a-zA-Z]{2,24})\x00?", data)
        if m:
            return m.group(1).decode("ascii", errors="ignore")
        _ = idx
        return None
    except Exception:
        return None
