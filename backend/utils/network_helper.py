import socket
import ssl
import requests
from typing import Dict, Any, Tuple
from utils.logging_config import logger

def is_internet_connected(timeout: float = 3.0) -> bool:
    """
    Fast, reliable probe to verify whether outbound internet access is active.
    Attempts a socket connection to a public reliable IP (Cloudflare / Google DNS).
    """
    probe_targets = [
        ("1.1.1.1", 53),
        ("8.8.8.8", 53),
        ("api.exa.ai", 443),
    ]
    for host, port in probe_targets:
        try:
            sock = socket.create_connection((host, port), timeout=timeout)
            sock.close()
            return True
        except (socket.timeout, socket.gaierror, OSError):
            continue
    return False

def get_lan_ip() -> str:
    """
    Returns the primary IPv4 address of this machine on the local network (LAN / Wi-Fi).
    """
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.2)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass
    try:
        return socket.gethostbyname(socket.gethostname())
    except Exception:
        return "127.0.0.1"

def diagnose_network_error(exc: Exception, context: str = "general") -> Dict[str, Any]:
    """
    Translates standard Python network and protocol exceptions into clean, 
    user-friendly diagnostic messages for the UI.
    """
    exc_str = str(exc)
    exc_type = type(exc).__name__

    # 1. Check for complete lack of internet connectivity
    if not is_internet_connected(timeout=1.5):
        return {
            "error_type": "NO_INTERNET",
            "message": "No internet connection detected. Please verify your Wi-Fi or network cable.",
            "details": exc_str,
            "is_network_down": True
        }

    # 2. DNS Resolution Failures
    if isinstance(exc, socket.gaierror) or "getaddrinfo failed" in exc_str.lower() or "nameresolutionerror" in exc_str.lower():
        return {
            "error_type": "DNS_RESOLUTION_FAILURE",
            "message": f"Unable to reach server hostname. Check the domain spelling or DNS settings.",
            "details": exc_str,
            "is_network_down": False
        }

    # 3. Connection Timeouts
    if isinstance(exc, (socket.timeout, TimeoutError, requests.exceptions.Timeout)) or "timed out" in exc_str.lower():
        return {
            "error_type": "CONNECTION_TIMEOUT",
            "message": f"The connection timed out while contacting {context}. The server may be busy or unreachable.",
            "details": exc_str,
            "is_network_down": False
        }

    # 4. Connection Refused
    if isinstance(exc, ConnectionRefusedError) or "connection refused" in exc_str.lower():
        return {
            "error_type": "CONNECTION_REFUSED",
            "message": f"Connection was refused by {context}. Verify that the target port and server address are correct.",
            "details": exc_str,
            "is_network_down": False
        }

    # 5. SSL / TLS Handshake Errors
    if isinstance(exc, ssl.SSLError) or "ssl" in exc_str.lower() or "certificate" in exc_str.lower():
        return {
            "error_type": "SSL_PROTOCOL_ERROR",
            "message": "SSL/TLS handshake failed. Ensure the correct port (587 for TLS, 465 for SSL) is configured.",
            "details": exc_str,
            "is_network_down": False
        }

    # 6. Generic Network / Request Failures
    return {
        "error_type": "NETWORK_ERROR",
        "message": f"Network operation failed: {exc_str[:200]}",
        "details": exc_str,
        "is_network_down": False
    }
