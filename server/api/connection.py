"""Pi connection management endpoints."""

from __future__ import annotations

import time

from fastapi import APIRouter, HTTPException

from ..config_store import load_config, save_config
from ..models import Connection
from ..ssh_client import SSHClient

router = APIRouter(prefix="/api/connection", tags=["connection"])


@router.get("/status")
def connection_status() -> dict:
    cfg = load_config()
    conn = cfg.connection
    client = SSHClient(conn.username, conn.tailscale_ip)
    try:
        t0 = time.monotonic()
        client.test()
        latency = round((time.monotonic() - t0) * 1000)
        return {
            "connected": True,
            "method": "tailscale",
            "host": conn.tailscale_ip,
            "latency_ms": latency,
        }
    except Exception:
        pass

    client = SSHClient(conn.username, conn.local_hostname)
    try:
        t0 = time.monotonic()
        client.test()
        latency = round((time.monotonic() - t0) * 1000)
        return {
            "connected": True,
            "method": "local",
            "host": conn.local_hostname,
            "latency_ms": latency,
        }
    except Exception:
        pass

    return {"connected": False, "method": None, "host": None, "latency_ms": None}


@router.post("/test")
def test_connection(host: str | None = None) -> dict:
    cfg = load_config()
    conn = cfg.connection
    target = host or conn.tailscale_ip
    client = SSHClient(conn.username, target)
    try:
        t0 = time.monotonic()
        info = client.test()
        latency = round((time.monotonic() - t0) * 1000)
        return {"connected": True, "host": target, "latency_ms": latency, "info": info}
    except Exception as e:
        raise HTTPException(502, f"Cannot connect to {target}: {e}")


@router.post("/discover")
def discover() -> dict:
    """Try Tailscale, then local, return what works."""
    return connection_status()


@router.get("/settings")
def get_connection_settings() -> Connection:
    cfg = load_config()
    return cfg.connection


@router.put("/settings")
def update_connection_settings(conn: Connection) -> Connection:
    cfg = load_config()
    cfg.connection = conn
    save_config(cfg)
    return conn
