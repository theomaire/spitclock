#!/usr/bin/env python3
"""Add WiFi networks from wifi_credentials.txt to the Pi via SSH."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from server.config_store import load_config
from server.ssh_client import SSHClient

CREDS_FILE = Path(__file__).resolve().parent.parent / "wifi_credentials.txt"


def parse_credentials(path: Path) -> list[tuple[str, str]]:
    """Parse SSID,PASSWORD lines from the credentials file."""
    if not path.exists():
        print(f"Error: {path} not found")
        sys.exit(1)

    networks = []
    for line in path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        parts = line.split(",", 1)
        if len(parts) != 2:
            print(f"Skipping malformed line: {line}")
            continue
        ssid, password = parts[0].strip(), parts[1].strip()
        if ssid and password:
            networks.append((ssid, password))
    return networks


def main():
    networks = parse_credentials(CREDS_FILE)
    if not networks:
        print("No WiFi credentials found in wifi_credentials.txt")
        print("Add lines in format: SSID,PASSWORD")
        sys.exit(1)

    print(f"Found {len(networks)} network(s) to add:")
    for ssid, _ in networks:
        print(f"  - {ssid}")

    # Connect to Pi
    cfg = load_config()
    conn = cfg.connection

    client = None
    for host in [conn.tailscale_ip, conn.local_hostname]:
        try:
            c = SSHClient(conn.username, host)
            c.test()
            client = c
            print(f"\nConnected to Pi via {host}")
            break
        except Exception:
            continue

    if client is None:
        print("\nError: Cannot reach Pi via Tailscale or local network")
        sys.exit(1)

    # Check existing connections
    existing = client.run("nmcli -t -f NAME connection show")
    existing_names = set(existing.strip().splitlines())

    for ssid, password in networks:
        con_name = f"wifi-{ssid}"
        if con_name in existing_names:
            print(f"  '{ssid}' already configured, updating password...")
            client.run(f"sudo nmcli connection modify '{con_name}' wifi-security.psk '{password}'")
        else:
            print(f"  Adding '{ssid}'...")
            client.run(
                f"sudo nmcli connection add type wifi con-name '{con_name}' "
                f"ssid '{ssid}' wifi-security.key-mgmt wpa-psk "
                f"wifi-security.psk '{password}' connection.autoconnect yes"
            )

    print("\nDone! The Pi will auto-connect to these networks on boot.")
    print("Current known WiFi networks on Pi:")
    result = client.run("nmcli -t -f NAME,TYPE connection show | grep wireless")
    for line in result.strip().splitlines():
        name = line.split(":")[0]
        print(f"  - {name}")


if __name__ == "__main__":
    main()
