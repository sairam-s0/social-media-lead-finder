import os
import sys
import time
import threading
import webbrowser
import requests
from pathlib import Path

# Safe stdout/stderr redirection for frozen GUI binaries
if sys.stdout is None:
    try:
        sys.stdout = open(os.devnull, "w")
    except Exception:
        pass
if sys.stderr is None:
    try:
        sys.stderr = open(os.devnull, "w")
    except Exception:
        pass

if sys.platform == "win32":
    try:
        import ctypes
        ATTACH_PARENT_PROCESS = -1
        if ctypes.windll.kernel32.AttachConsole(ATTACH_PARENT_PROCESS):
            sys.stdout = open("CONOUT$", "w", buffering=1, encoding="utf-8")
            sys.stderr = open("CONOUT$", "w", buffering=1, encoding="utf-8")
    except Exception:
        pass

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
if str(BASE_DIR) not in sys.path:
    sys.path.insert(0, str(BASE_DIR))

# Ensure numpy compatibility shim is active before loading any packages (e.g. openpyxl)
import utils.numpy_compat

from config import Config
from utils.logging_config import logger
from utils.single_instance import SingleInstance
from app import app

def wait_for_server(url: str, timeout: int = 15) -> bool:
    start_time = time.time()
    while time.time() - start_time < timeout:
        try:
            res = requests.get(url, timeout=1.5)
            if res.status_code == 200:
                return True
        except Exception:
            pass
        time.sleep(0.3)
    return False

def start_flask():
    logger.info(f"Starting embedded backend server on http://{Config.HOST}:{Config.PORT}...")
    try:
        from werkzeug.serving import run_simple
        run_simple(Config.HOST, Config.PORT, app, threaded=True, use_reloader=False)
    except Exception as e:
        logger.error(f"Failed to start backend server: {e}")

def main():
    logger.info("Initializing Lead Finder v2 Launcher...")

    local_host = "127.0.0.1" if Config.HOST in ("0.0.0.0", "::", "") else Config.HOST
    local_url = f"http://{local_host}:{Config.PORT}"
    health_url = f"{local_url}/api/health"

    if "--version" in sys.argv:
        print(f"{Config.APP_NAME} v{Config.VERSION}")
        sys.exit(0)

    if "--check-health" in sys.argv:
        server_thread = threading.Thread(target=start_flask, daemon=True)
        server_thread.start()
        if wait_for_server(health_url, timeout=15):
            print(f"[HEALTH_OK] {Config.APP_NAME} backend and database initialized successfully.")
            sys.exit(0)
        else:
            print(f"[HEALTH_ERROR] {Config.APP_NAME} backend failed to start.")
            sys.exit(1)

    # Single-instance enforcement
    single_instance = SingleInstance()
    if not single_instance.acquire():
        logger.warning("Another instance of Lead Finder is already running. Opening existing instance...")
        webbrowser.open(local_url)
        sys.exit(0)

    # Start Flask server in background thread (binds to 0.0.0.0 to enable mobile phone sync)
    server_thread = threading.Thread(target=start_flask, daemon=True)
    server_thread.start()

    if not wait_for_server(health_url, timeout=15):
        logger.error("Backend server failed to start within timeout period.")
        sys.exit(1)

    logger.info(f"Server is healthy at {local_url} (LAN binding: {Config.HOST}:{Config.PORT}). Launching user interface...")

    if "--headless" in sys.argv:
        logger.info("Running in headless mode.")
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass
        single_instance.release()
        logger.info(f"{Config.APP_NAME} shutdown complete.")
        sys.exit(0)

    # Try native pywebview window first, fallback to browser
    use_webview = False
    try:
        import webview
        use_webview = True
    except ImportError:
        logger.info("pywebview not installed; launching in default browser.")

    if use_webview:
        try:
            webview.create_window(
                title=Config.APP_NAME,
                url=local_url,
                width=1280,
                height=840,
                min_size=(380, 500),
                confirm_close=False
            )
            webview.start()
        except Exception as e:
            logger.warning(f"pywebview window could not be opened ({e}). Falling back to default browser.")
            webbrowser.open(local_url)
            try:
                while True:
                    time.sleep(1)
            except KeyboardInterrupt:
                pass
    else:
        webbrowser.open(local_url)
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            pass

    single_instance.release()
    logger.info("Social Lead Finder shutdown complete.")

if __name__ == "__main__":
    main()
