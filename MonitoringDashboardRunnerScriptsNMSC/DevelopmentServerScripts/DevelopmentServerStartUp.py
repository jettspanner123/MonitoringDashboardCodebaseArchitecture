"""Starts the ObservaCore backend, frontend, and client-machine relay worker
for local development in the background, with each process's output captured
to its own file under Logs/. Run DevelopmentServerShutDown.py to stop them.
"""

import json
import subprocess
import sys
import time
import os
from pathlib import Path

from DevServerProcessUtility import DevServerProcessUtility


class DevelopmentServerStartUp:
    SCRIPTS_DIR = Path(__file__).resolve().parent
    REPO_ROOT = SCRIPTS_DIR.parents[1]
    LOGS_DIR = SCRIPTS_DIR / "Logs"
    STATE_FILE = SCRIPTS_DIR / "DevServerState.json"

    BACKEND_DIR = REPO_ROOT / "MonitoringDashboardOrchestratorServiceLayerMSC"
    FRONTEND_DIR = REPO_ROOT / "MonitoringDashboardClientServiceLayerMSC"
    RELAY_DIR = REPO_ROOT / "MonitoringDashboardClientMachineRelayWorkerMSC"
    RELAY_WEBSOCKET_URL = "ws://localhost:4000/api/v1/client-machine-services/relay/connect"

    @classmethod
    def run(cls) -> None:
        cls._log("Starting development servers...")
        cls._stop_previous_session_if_running()

        relay_secret = DevServerProcessUtility.read_env_value(cls.BACKEND_DIR / ".env", "RELAY_SHARED_SECRET")
        if relay_secret is None:
            cls._log("ERROR: RELAY_SHARED_SECRET not found in the backend's .env - cannot start the relay worker.")
            sys.exit(1)

        state = {
            "backend": cls._spawn("Backend", ["npm.cmd", "run", "dev"], cls.BACKEND_DIR, None),
            "frontend": cls._spawn("Frontend", ["npm.cmd", "run", "dev"], cls.FRONTEND_DIR, None),
            "relay": cls._spawn(
                "Relay",
                ["dotnet", "run"],
                cls.RELAY_DIR,
                {
                    "RelayConnection__BackendWebSocketUrl": cls.RELAY_WEBSOCKET_URL,
                    "RelayConnection__SharedSecret": relay_secret,
                },
            ),
        }
        cls.STATE_FILE.write_text(json.dumps(state, indent=2))

        cls._log("Waiting 5 seconds before checking status...")
        time.sleep(5)
        for name, info in state.items():
            alive = DevServerProcessUtility.is_pid_alive(info["pid"])
            status = "running" if alive else "EXITED ALREADY - check its log"
            cls._log(f"  {name}: pid {info['pid']} - {status} - log: {info['log']}")

        cls._log("Backend:  http://localhost:4000")
        cls._log("Frontend: check Logs/Frontend.log for the printed URL (usually http://localhost:5173)")
        cls._log(f"Logs directory: {cls.LOGS_DIR}")
        cls._log("Run DevelopmentServerShutDown.py to stop everything.")

    @classmethod
    def _spawn(cls, name: str, command: list[str], cwd: Path, extra_env: dict[str, str] | None) -> dict:
        cls.LOGS_DIR.mkdir(parents=True, exist_ok=True)
        log_path = cls.LOGS_DIR / f"{name}.log"
        log_file = open(log_path, "w", encoding="utf-8")

        env = os.environ.copy()
        if extra_env:
            env.update(extra_env)

        process = subprocess.Popen(
            command,
            cwd=str(cwd),
            stdout=log_file,
            stderr=subprocess.STDOUT,
            env=env,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP,
        )
        cls._log(f"Started {name} (pid {process.pid}) in {cwd}")
        return {"pid": process.pid, "log": str(log_path)}

    @classmethod
    def _stop_previous_session_if_running(cls) -> None:
        if not cls.STATE_FILE.exists():
            return
        try:
            previous_state = json.loads(cls.STATE_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            return

        still_alive = [info["pid"] for info in previous_state.values() if DevServerProcessUtility.is_pid_alive(info["pid"])]
        if not still_alive:
            return

        cls._log("Found a previous session still running - stopping it first...")
        for pid in still_alive:
            DevServerProcessUtility.kill_tree(pid)
        cls.STATE_FILE.unlink(missing_ok=True)

    @classmethod
    def _log(cls, message: str) -> None:
        DevServerProcessUtility.log(cls.LOGS_DIR, message)


if __name__ == "__main__":
    DevelopmentServerStartUp.run()
