import logging
import sys
import re
from config import Config

class SecretFilter(logging.Filter):
    """
    Ensures API keys, bot tokens, and session tokens are NEVER leaked into logs.
    """
    SENSITIVE_PATTERNS = [
        re.compile(r"(bot[0-9]{8,10}:[a-zA-Z0-9_-]{35})", re.IGNORECASE),
        re.compile(r"([0-9a-f]{64})", re.IGNORECASE),  # 64-char session hex token
        re.compile(r"(Bearer\s+[A-Za-z0-9_\-\.]+)", re.IGNORECASE),
        re.compile(r"(x-api-key['\":\s=]+)([a-zA-Z0-9_\-]{16,})", re.IGNORECASE),
    ]

    def filter(self, record):
        if isinstance(record.msg, str):
            for pattern in self.SENSITIVE_PATTERNS:
                record.msg = pattern.sub(r"[REDACTED_SECRET]", record.msg)
        return True

def setup_logging():
    logger = logging.getLogger("social_lead_finder")
    if not logger.handlers:
        logger.setLevel(logging.INFO)
        formatter = logging.Formatter(
            "[%(asctime)s] [%(levelname)s] [%(name)s]: %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )

        secret_filter = SecretFilter()

        # Console Handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setFormatter(formatter)
        console_handler.addFilter(secret_filter)
        logger.addHandler(console_handler)

        # File Handler (Writing to %APPDATA%\SocialLeadFinder\logs\app.log)
        try:
            log_file = Config.LOGS_DIR / "app.log"
            file_handler = logging.FileHandler(log_file, encoding="utf-8")
            file_handler.setFormatter(formatter)
            file_handler.addFilter(secret_filter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Could not initialize file log handler at {Config.LOGS_DIR}: {e}")

    return logger

logger = setup_logging()
