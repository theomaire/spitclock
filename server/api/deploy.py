"""Deploy config and code to the Pi."""

from __future__ import annotations

import json
from pathlib import Path

from fastapi import APIRouter, HTTPException

from ..config_store import load_config, save_config
from ..ssh_client import SSHClient

router = APIRouter(prefix="/api/deploy", tags=["deploy"])

PI_CLOCK_PY = Path(__file__).resolve().parent.parent.parent / "pi" / "clock.py"


def _get_client() -> tuple[SSHClient, str]:
    """Return a connected SSH client and the remote path."""
    cfg = load_config()
    conn = cfg.connection
    # Try Tailscale first, then local
    for host in [conn.tailscale_ip, conn.local_hostname]:
        client = SSHClient(conn.username, host)
        try:
            client.test()
            return client, conn.remote_path
        except Exception:
            continue
    raise HTTPException(502, "Cannot reach Pi via Tailscale or local network")


@router.post("/push")
def push_to_pi() -> dict:
    """Upload config.json and clock.py, restart service."""
    cfg = load_config()
    # Ensure config is saved to disk first
    save_config(cfg)

    client, remote_path = _get_client()

    try:
        # Upload config.json
        config_json = json.dumps(cfg.model_dump(), indent=2) + "\n"
        client.write_file(f"{remote_path}/config.json", config_json)

        # Upload clock.py
        if PI_CLOCK_PY.exists():
            client.upload_file(str(PI_CLOCK_PY), f"{remote_path}/clock.py")

        # Restart service
        result = client.run("sudo systemctl restart spitclock.service")

        # Verify
        status = client.run("sudo systemctl is-active spitclock.service")

        return {
            "success": True,
            "service_status": status.strip(),
            "message": "Deployed successfully",
        }
    except Exception as e:
        raise HTTPException(500, f"Deploy failed: {e}")


@router.get("/status")
def deploy_status() -> dict:
    """Check if spitclock service is running on Pi."""
    try:
        client, remote_path = _get_client()
        status = client.run("sudo systemctl is-active spitclock.service")
        return {"running": status.strip() == "active", "status": status.strip()}
    except HTTPException:
        return {"running": False, "status": "unreachable"}
    except Exception as e:
        return {"running": False, "status": str(e)}


@router.post("/sync-time")
def sync_time() -> dict:
    """Trigger NTP sync on the Pi."""
    try:
        client, _ = _get_client()
        client.run("sudo timedatectl set-ntp true")
        result = client.run("timedatectl status")
        return {"success": True, "output": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Time sync failed: {e}")
