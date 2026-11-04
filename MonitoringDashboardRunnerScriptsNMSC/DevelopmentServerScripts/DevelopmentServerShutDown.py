"""Stops whatever DevelopmentServerStartUp.py started (backend, frontend,
relay worker) and clears the saved state file.
"""

import json
from pathlib import Path

from DevServerProcessUtility import DevServerProcessUtility


class DevelopmentServerShutDown:
    SCRIPTS_DIR = Path(__file__).resolve().parent
    LOGS_DIR = SCRIPTS_DIR / "Logs"
    STATE_FILE = SCRIPTS_DIR / "DevServerState.json"

    @classmethod
    def run(cls) -> None:
        if not cls.STATE_FILE.exists():
            cls._log("No DevServerState.json found - nothing appears to be running.")
            return

        try:
            state = json.loads(cls.STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError) as error:
            cls._log(f"Could not read {cls.STATE_FILE.name}: {error}")
            return

        for name, info in state.items():
            pid = info["pid"]
            if DevServerProcessUtility.is_pid_alive(pid):
                DevServerProcessUtility.kill_tree(pid)
                cls._log(f"Stopped {name} (pid {pid}).")
            else:
                cls._log(f"{name} (pid {pid}) was already stopped.")

        cls.STATE_FILE.unlink(missing_ok=True)
        cls._log("All development servers stopped.")

    @classmethod
    def _log(cls, message: str) -> None:
        DevServerProcessUtility.log(cls.LOGS_DIR, message)


if __name__ == "__main__":
    DevelopmentServerShutDown.run()
