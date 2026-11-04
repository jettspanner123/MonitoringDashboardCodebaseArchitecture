"""Shared process/log helpers used by DevelopmentServerStartUp.py and
DevelopmentServerShutDown.py. Windows-only (tasklist/taskkill), matching the
dev machine this runs on.
"""

import ctypes
import subprocess
import sys
from datetime import datetime
from pathlib import Path


class DevServerProcessUtility:
    class Color:
        RESET = "\033[0m"
        CYAN = "\033[96m"
        YELLOW = "\033[93m"
        GREEN = "\033[92m"
        RED = "\033[91m"
        RED_BOLD = "\033[1;91m"
        BLUE = "\033[94m"
        MAGENTA = "\033[95m"
        GRAY = "\033[90m"

    @staticmethod
    def enable_ansi_support() -> None:
        # Windows Terminal/PowerShell 7 already render ANSI; legacy conhost
        # needs this console mode flag flipped on first.
        kernel32 = ctypes.windll.kernel32
        handle = kernel32.GetStdHandle(-11)
        mode = ctypes.c_uint32()
        if kernel32.GetConsoleMode(handle, ctypes.byref(mode)):
            kernel32.SetConsoleMode(handle, mode.value | 0x0004)
        # Some Windows consoles still default stdout to a legacy codepage
        # (e.g. cp1252) that can't encode emoji - force UTF-8 regardless.
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

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
    def log(logs_dir: Path, message: str, emoji: str = "", color: str = "") -> None:
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        prefix = f"{emoji} " if emoji else ""
        plain_line = f"[{timestamp}] {prefix}{message}"
        console_line = f"[{timestamp}] {color}{prefix}{message}{DevServerProcessUtility.Color.RESET}" if color else plain_line

        print(console_line)
        logs_dir.mkdir(parents=True, exist_ok=True)
        with open(logs_dir / "Runner.log", "a", encoding="utf-8") as log_file:
            log_file.write(plain_line + "\n")
