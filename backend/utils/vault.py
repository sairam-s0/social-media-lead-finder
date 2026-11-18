import os
import sys
import json
import base64
from typing import Optional, Dict
from config import Config
from utils.logging_config import logger

try:
    import keyring
    KEYRING_AVAILABLE = True
except ImportError:
    KEYRING_AVAILABLE = False
    logger.warning("keyring module not available; using local DPAPI encrypted vault file.")

SERVICE_NAME = "SocialLeadFinder"
FALLBACK_VAULT_FILE = Config.DATA_DIR / ".vault.enc"

def _win_protect(data: bytes) -> bytes:
    """Encrypts bytes using Windows DPAPI (CryptProtectData)."""
    if sys.platform != "win32":
        return data
    import ctypes
    import ctypes.wintypes

    class DATA_BLOB(ctypes.Structure):
        _fields_ = [("cbData", ctypes.wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]

    p_data = ctypes.cast(ctypes.create_string_buffer(data, len(data)), ctypes.POINTER(ctypes.c_byte))
    blob_in = DATA_BLOB(len(data), p_data)
    blob_out = DATA_BLOB()

    if not ctypes.windll.crypt32.CryptProtectData(
        ctypes.byref(blob_in),
        "SocialLeadFinderVault",
        None,
        None,
        None,
        0,
        ctypes.byref(blob_out)
    ):
        raise RuntimeError("Windows DPAPI CryptProtectData failed.")

    try:
        buffer = (ctypes.c_byte * blob_out.cbData)()
        ctypes.memmove(buffer, blob_out.pbData, blob_out.cbData)
        return bytes(buffer)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)

def _win_unprotect(data: bytes) -> bytes:
    """Decrypts bytes using Windows DPAPI (CryptUnprotectData)."""
    if sys.platform != "win32":
        return data
    import ctypes
    import ctypes.wintypes

    class DATA_BLOB(ctypes.Structure):
        _fields_ = [("cbData", ctypes.wintypes.DWORD), ("pbData", ctypes.POINTER(ctypes.c_byte))]

    p_data = ctypes.cast(ctypes.create_string_buffer(data, len(data)), ctypes.POINTER(ctypes.c_byte))
    blob_in = DATA_BLOB(len(data), p_data)
    blob_out = DATA_BLOB()

    if not ctypes.windll.crypt32.CryptUnprotectData(
        ctypes.byref(blob_in),
        None,
        None,
        None,
        None,
        0,
        ctypes.byref(blob_out)
    ):
        raise RuntimeError("Windows DPAPI CryptUnprotectData failed.")

    try:
        buffer = (ctypes.c_byte * blob_out.cbData)()
        ctypes.memmove(buffer, blob_out.pbData, blob_out.cbData)
        return bytes(buffer)
    finally:
        ctypes.windll.kernel32.LocalFree(blob_out.pbData)

def _read_fallback_vault() -> Dict[str, str]:
    if not FALLBACK_VAULT_FILE.exists():
        return {}
    try:
        encrypted_data = FALLBACK_VAULT_FILE.read_bytes()
        decrypted_json = _win_unprotect(encrypted_data).decode("utf-8")
        return json.loads(decrypted_json)
    except Exception as e:
        logger.error(f"Error reading DPAPI encrypted vault file: {e}")
        return {}

def _write_fallback_vault(data: Dict[str, str]):
    try:
        raw_json = json.dumps(data).encode("utf-8")
        encrypted_data = _win_protect(raw_json)
        FALLBACK_VAULT_FILE.write_bytes(encrypted_data)
    except Exception as e:
        logger.error(f"Error writing DPAPI encrypted vault file: {e}")

class Vault:
    """
    Secure Encrypted Vault for Social Lead Finder.
    Stores API keys, tokens, and license secrets in Windows Credential Manager / DPAPI.
    Never stores secrets in plaintext in SQLite or .env.
    """

    @classmethod
    def set_secret(cls, key: str, value: str) -> bool:
        if not key:
            return False
        value = str(value or "").strip()
        success = False

        if KEYRING_AVAILABLE:
            try:
                keyring.set_password(SERVICE_NAME, key, value)
                success = True
            except Exception as e:
                logger.warning(f"Keyring failed for {key}, using DPAPI file fallback: {e}")

        # Always keep fallback file synchronized
        try:
            current = _read_fallback_vault()
            current[key] = value
            _write_fallback_vault(current)
            success = True
        except Exception as e:
            logger.error(f"Failed to write secret {key} to fallback vault: {e}")

        return success

    @classmethod
    def get_secret(cls, key: str, default: str = "") -> str:
        if not key:
            return default

        # Try Keyring first
        if KEYRING_AVAILABLE:
            try:
                val = keyring.get_password(SERVICE_NAME, key)
                if val:
                    return val
            except Exception:
                pass

        # Try fallback file
        try:
            vault_dict = _read_fallback_vault()
            if key in vault_dict and vault_dict[key]:
                return vault_dict[key]
        except Exception:
            pass

        # Environment variable fallback (for dev override only)
        env_val = os.getenv(key.upper())
        if env_val:
            return env_val

        return default

    @classmethod
    def delete_secret(cls, key: str) -> bool:
        if not key:
            return False
        if KEYRING_AVAILABLE:
            try:
                keyring.delete_password(SERVICE_NAME, key)
            except Exception:
                pass
        try:
            vault_dict = _read_fallback_vault()
            if key in vault_dict:
                del vault_dict[key]
                _write_fallback_vault(vault_dict)
        except Exception:
            pass
        return True

    @classmethod
    def has_secret(cls, key: str) -> bool:
        val = cls.get_secret(key)
        return bool(val and val.strip())

    @classmethod
    def mask_secret(cls, val: str) -> str:
        if not val or not str(val).strip():
            return ""
        s = str(val).strip()
        if len(s) <= 4:
            return "••••"
        return f"••••••••{s[-4:]}"

    @classmethod
    def get_secrets_status(cls) -> Dict[str, any]:
        """
        Returns safe status dictionary containing flags and masked previews only.
        NEVER returns plain secrets.
        """
        exa_key = cls.get_secret("exa_api_key")
        tg_token = cls.get_secret("telegram_bot_token")
        tg_chat = cls.get_secret("telegram_chat_id")
        license_key = cls.get_secret("license_key")
        smtp_password = cls.get_secret("smtp_password")

        return {
            "exa_configured": bool(exa_key),
            "exa_masked": cls.mask_secret(exa_key),
            "telegram_bot_configured": bool(tg_token),
            "telegram_bot_masked": cls.mask_secret(tg_token),
            "telegram_chat_configured": bool(tg_chat),
            "telegram_chat_masked": cls.mask_secret(tg_chat) if len(tg_chat) > 4 else ("••••" if tg_chat else ""),
            "license_configured": bool(license_key),
            "license_masked": cls.mask_secret(license_key),
            "smtp_configured": bool(smtp_password),
            "smtp_password_masked": cls.mask_secret(smtp_password),
        }
