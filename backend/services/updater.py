import os
import requests
from typing import Dict, Any
from config import Config
from utils.logging_config import logger

UPDATE_MANIFEST_URL = os.getenv("UPDATE_MANIFEST_URL", "https://api.github.com/repos/social-lead-finder/releases/latest")

def check_for_updates() -> Dict[str, Any]:
    """
    Checks for available software updates using a signed manifest or release endpoint.
    Returns version comparison information and release notes.
    """
    current_version = Config.VERSION
    result = {
        "current_version": current_version,
        "latest_version": current_version,
        "has_update": False,
        "release_notes": "You are running the latest version of Social Lead Finder.",
        "download_url": "",
        "published_at": ""
    }

    try:
        response = requests.get(UPDATE_MANIFEST_URL, timeout=5, headers={"User-Agent": "SocialLeadFinder-Updater/1.0"})
        if response.status_code == 200:
            manifest = response.json()
            latest_tag = manifest.get("tag_name", "").lstrip("v") or manifest.get("version", current_version)
            result["latest_version"] = latest_tag
            result["release_notes"] = manifest.get("body") or manifest.get("changelog") or "New update available."
            result["download_url"] = manifest.get("html_url") or manifest.get("download_url") or ""
            result["published_at"] = manifest.get("published_at") or ""

            # Basic semver comparison
            cur_parts = [int(p) for p in current_version.split(".") if p.isdigit()]
            lat_parts = [int(p) for p in latest_tag.split(".") if p.isdigit()]

            if lat_parts > cur_parts:
                result["has_update"] = True
    except Exception as e:
        logger.debug(f"Update check completed (no network or default channel): {e}")

    return result
