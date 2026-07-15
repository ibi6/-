from pathlib import Path

from app.services.pcap_parser import parse_pcap_file
from app.services.seed import _build_demo_pcap


def test_parse_demo_pcap(tmp_path: Path):
    pcap = tmp_path / "demo.pcap"
    _build_demo_pcap(pcap)
    result = parse_pcap_file(str(pcap))
    assert result.packet_count == 3
    assert len(result.sessions) >= 1
    assert len(result.payloads) >= 2
    protocols = {p["protocol"] for p in result.payloads}
    assert "HTTP" in protocols
    assert "DNS" in protocols
    # sensitive password field should produce high severity somewhere
    severities = {p["severity"] for p in result.payloads}
    assert "high" in severities or "medium" in severities


def test_invalid_magic(tmp_path: Path):
    bad = tmp_path / "bad.pcap"
    bad.write_bytes(b"not-a-pcap-file!!!!!!!!!!")
    try:
        parse_pcap_file(str(bad))
        assert False, "expected ValueError"
    except ValueError:
        pass
