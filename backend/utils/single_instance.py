import os
import sys
from config import Config
from utils.logging_config import logger

class SingleInstance:
    r"""
    Enforces that only one instance of the Social Lead Finder app runs at a time.
    Uses Windows Named Mutex on Windows and a file lock in %APPDATA%\SocialLeadFinder\app.lock.
    """
    def __init__(self, name: str = "SocialLeadFinderSingleInstanceMutex"):
        self.name = f"Local\\{name}"
        self.mutex = None
        self.lock_file = Config.DATA_DIR / "app.lock"
        self.is_running = False

    def acquire(self) -> bool:
        # Windows Mutex check
        if sys.platform == "win32":
            try:
                import ctypes
                from ctypes import wintypes
                
                ERROR_ALREADY_EXISTS = 183
                self.mutex = ctypes.windll.kernel32.CreateMutexW(None, False, self.name)
                last_error = ctypes.windll.kernel32.GetLastError()
                
                if last_error == ERROR_ALREADY_EXISTS:
                    logger.warning("Another instance of Social Lead Finder is already running (Windows Mutex active).")
                    self.is_running = True
                    return False
            except Exception as e:
                logger.warning(f"Windows mutex acquisition error: {e}")

        # Secondary file-based PID lock check
        try:
            if self.lock_file.exists():
                old_pid_str = self.lock_file.read_text().strip()
                if old_pid_str.isdigit():
                    old_pid = int(old_pid_str)
                    if self._is_pid_alive(old_pid):
                        logger.warning(f"Another instance is running with PID {old_pid}.")
                        self.is_running = True
                        return False
            
            # Write current PID
            self.lock_file.write_text(str(os.getpid()))
        except Exception as e:
            logger.debug(f"Lock file creation warning: {e}")

        return True

    def _is_pid_alive(self, pid: int) -> bool:
        if pid <= 0 or pid == os.getpid():
            return False
        if sys.platform == "win32":
            import ctypes
            PROCESS_QUERY_INFORMATION = 0x0400
            STILL_ACTIVE = 259
            handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_INFORMATION, False, pid)
            if not handle:
                return False
            exit_code = ctypes.wintypes.DWORD()
            ctypes.windll.kernel32.GetExitCodeProcess(handle, ctypes.byref(exit_code))
            ctypes.windll.kernel32.CloseHandle(handle)
            return exit_code.value == STILL_ACTIVE
        else:
            try:
                os.kill(pid, 0)
                return True
            except OSError:
                return False

    def release(self):
        if sys.platform == "win32" and self.mutex:
            try:
                import ctypes
                ctypes.windll.kernel32.CloseHandle(self.mutex)
                self.mutex = None
            except Exception:
                pass
        try:
            if self.lock_file.exists():
                self.lock_file.unlink(missing_ok=True)
        except Exception:
            pass
