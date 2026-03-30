"""Cross-platform SSH/SFTP wrapper using paramiko."""

from __future__ import annotations

import io
from pathlib import Path

import paramiko


class SSHClient:
    """Lightweight SSH wrapper for Pi communication."""

    def __init__(self, username: str, host: str, port: int = 22, timeout: float = 5.0):
        self.username = username
        self.host = host
        self.port = port
        self.timeout = timeout

    def _connect(self) -> paramiko.SSHClient:
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        client.connect(
            hostname=self.host,
            port=self.port,
            username=self.username,
            timeout=self.timeout,
            # Use SSH agent and default keys
            look_for_keys=True,
            allow_agent=True,
        )
        return client

    def test(self) -> str:
        """Test the connection, return hostname."""
        client = self._connect()
        try:
            _, stdout, _ = client.exec_command("hostname")
            return stdout.read().decode().strip()
        finally:
            client.close()

    def run(self, command: str) -> str:
        """Run a command and return stdout."""
        client = self._connect()
        try:
            _, stdout, stderr = client.exec_command(command, timeout=30)
            exit_code = stdout.channel.recv_exit_status()
            out = stdout.read().decode()
            err = stderr.read().decode()
            if exit_code != 0:
                raise RuntimeError(f"Command failed (exit {exit_code}): {err or out}")
            return out
        finally:
            client.close()

    def upload_file(self, local_path: str, remote_path: str) -> None:
        """Upload a local file to the Pi via SFTP."""
        client = self._connect()
        try:
            sftp = client.open_sftp()
            sftp.put(local_path, remote_path)
            sftp.close()
        finally:
            client.close()

    def write_file(self, remote_path: str, content: str) -> None:
        """Write string content to a remote file via SFTP."""
        client = self._connect()
        try:
            sftp = client.open_sftp()
            with sftp.file(remote_path, "w") as f:
                f.write(content)
            sftp.close()
        finally:
            client.close()
