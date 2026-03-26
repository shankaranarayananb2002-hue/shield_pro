import subprocess
import time
import sys
import os
import socket


def port_in_use(port: int) -> bool:
    """Check if a TCP port is already bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(1)
        return s.connect_ex(("127.0.0.1", port)) == 0


def run_shield():
    print("""
    #########################################
    #       PROJECT SHIELD  v2.0            #
    #    Forensic Reconnaissance System     #
    #########################################
    """)

    # ── Port guard ────────────────────────────────────────────
    if port_in_use(8000):
        print("⚠️  WARNING: Port 8000 is already in use.")
        print("   Stop any existing SHIELD/uvicorn instances first,")
        print("   or run:  taskkill /F /IM python.exe  (Windows)")
        choice = input("   Continue anyway? (y/n): ").strip().lower()
        if choice != "y":
            print("🛑 Aborted.")
            return

    processes = []

    try:
        # ── NODE 1: FastAPI Backend ───────────────────────────
        print("🚀 [NODE 1] Starting Backend API (Port 8000)...")
        backend = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "backend.main:app",
             "--host", "0.0.0.0", "--port", "8000", "--log-level", "warning"],
            # stdout visible so errors appear in this terminal
        )
        processes.append(backend)
        time.sleep(2)  # Let FastAPI bind before watchdog imports

        # ── NODE 2: Forensic Watchdog ─────────────────────────
        print("🛡️  [NODE 2] Starting Global Watchdog Engine...")
        watchdog = subprocess.Popen(
            [sys.executable, "-m", "backend.watchdog"]
        )
        processes.append(watchdog)

        # ── NODE 3: War Room Alert Feed ───────────────────────
        print("🚨 [NODE 3] Activating Real-Time War Room...")
        if os.name == "nt":  # Windows — open a separate console window
            alert_room = subprocess.Popen(
                ["cmd", "/k", sys.executable, "-m", "backend.alert_room"],
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            alert_room = subprocess.Popen(
                [sys.executable, "-m", "backend.alert_room"]
            )
        processes.append(alert_room)

        print("\n✅ ALL FORENSIC NODES ONLINE. Ctrl+C to stop.\n")
        print("   Dashboard → http://localhost:3001")
        print("   API Docs  → http://localhost:8000/docs")
        print("   Health    → http://localhost:8000/health\n")

        # ── Keep alive & monitor child health ─────────────────
        while True:
            for p in processes:
                ret = p.poll()
                if ret is not None:
                    print(f"⚠️  A node exited with code {ret}. Check logs above.")
            time.sleep(5)

    except KeyboardInterrupt:
        print("\n\n🛑 SHIELD SHUTDOWN INITIATED...")
        for p in processes:
            try:
                p.terminate()
            except Exception:
                pass
        # Give them a moment to shut down gracefully
        time.sleep(2)
        for p in processes:
            try:
                p.kill()
            except Exception:
                pass
        print("👋 All nodes deactivated. Surveillance offline.\n")


if __name__ == "__main__":
    run_shield()
