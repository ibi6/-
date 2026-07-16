"""Structured logging setup for PayloadX API."""
from __future__ import annotations

import logging
import sys
from logging.handlers import RotatingFileHandler

from app.core.config import DATA_DIR


def setup_logging(level: str = "INFO") -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    log_file = DATA_DIR / "payloadx.log"

    root = logging.getLogger()
    root.setLevel(getattr(logging, level.upper(), logging.INFO))

    fmt = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    # Avoid duplicate handlers on reload
    if root.handlers:
        return

    sh = logging.StreamHandler(sys.stdout)
    sh.setFormatter(fmt)
    root.addHandler(sh)

    fh = RotatingFileHandler(log_file, maxBytes=2_000_000, backupCount=3, encoding="utf-8")
    fh.setFormatter(fmt)
    root.addHandler(fh)
