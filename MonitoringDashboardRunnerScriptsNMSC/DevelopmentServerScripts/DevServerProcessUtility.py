"""Shared process/log helpers used by DevelopmentServerStartUp.py and
DevelopmentServerShutDown.py. Windows-only (tasklist/taskkill), matching the
dev machine this runs on.
"""

import subprocess
from datetime import datetime
from pathlib import Path


class DevServerProcessUtility:
    @staticmethod
    def is_pid_alive(pid: int) -> bool:
        # shortcut: PIDs can be reused by an unrelated process after a reboot;
        # upgrade to also matching the process name/command line if that ever bites.
        result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}"],
            capture_output=True,
            text=True,
            check=False,
        )
        return str(pid) in result.stdout

    @staticmethod
    def kill_tree(pid: int) -> None:
        subprocess.run(["taskkill", "/PID", str(pid), "/T", "/F"], capture_output=True, check=False)

    @staticmethod
    def read_env_value(env_path: Path, key: str) -> str | None:
        if not env_path.exists():
            return None
        for line in env_path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            found_key, _, value = line.partition("=")
            if found_key.strip() == key:
                return value.strip()
        return None

    @staticmethod
    def log(logs_dir: Path, message: str) -> None:
        line = f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] {message}"
        print(line)
        logs_dir.mkdir(parents=True, exist_ok=True)
        with open(logs_dir / "Runner.log", "a", encoding="utf-8") as log_file:
            log_file.write(line + "\n")
