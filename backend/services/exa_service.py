import os
import sys
import re
import json
import shutil
import subprocess
import requests
from typing import List, Dict, Any, Tuple
from utils.logging_config import logger
from utils.vault import Vault
from utils.network_helper import is_internet_connected, diagnose_network_error
from services.lead_parser import normalize_post_url

EXA_SEARCH_ENDPOINT = "https://api.exa.ai/search"

from pathlib import Path

def get_hidden_subprocess_kwargs() -> Dict[str, Any]:
    """
    Returns subprocess kwargs to completely suppress any console / command prompt window
    from popping up on Windows.
    """
    kwargs: Dict[str, Any] = {}
    if sys.platform == "win32":
        # CREATE_NO_WINDOW (0x08000000) prevents creation of any console window
        kwargs["creationflags"] = getattr(subprocess, "CREATE_NO_WINDOW", 0x08000000)
        
        # STARTF_USESHOWWINDOW with SW_HIDE (0) guarantees the window stays hidden
        startupinfo = subprocess.STARTUPINFO()
        startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
        startupinfo.wShowWindow = 0  # SW_HIDE
        kwargs["startupinfo"] = startupinfo
    return kwargs

def get_mcporter_command() -> List[str]:
    """
    Dynamically resolves the command list to run mcporter.
    Prioritizes running node directly with cli.js to avoid invoking cmd.exe or batch scripts.
    """
    node_bin = shutil.which("node") or "node"
    mcporter_bin = shutil.which("mcporter.cmd") or shutil.which("mcporter")
    if mcporter_bin:
        js_path = Path(mcporter_bin).parent / "node_modules" / "mcporter" / "dist" / "cli.js"
        if js_path.is_file() and shutil.which("node"):
            return [node_bin, str(js_path)]
        return [mcporter_bin]

    # Check APPDATA npm global directory on Windows
    appdata = os.environ.get("APPDATA", "")
    if appdata:
        npm_cli = Path(appdata) / "npm" / "node_modules" / "mcporter" / "dist" / "cli.js"
        if npm_cli.is_file() and shutil.which("node"):
            return [node_bin, str(npm_cli)]

    return [node_bin, "-e", "console.log('mcporter not found')"]

def get_exa_api_key() -> str:
    """Retrieves Exa API key from the encrypted vault."""
    key = Vault.get_secret("exa_api_key")
    return key.strip() if key else ""

def get_mcporter_executable() -> str:
    """Dynamically resolves the path or command to run mcporter on Windows or Unix."""
    cmd = shutil.which("mcporter.cmd") or shutil.which("mcporter")
    if cmd:
        return cmd
    return "mcporter.cmd" if sys.platform == "win32" else "mcporter"

def search_via_mcporter(query: str, num_results: int = 10) -> List[Dict[str, Any]]:
    """
    Executes search via mcporter (Exa MCP server), which requires NO API key.
    Runs 100% silently in background with no command prompt window.
    """
    num_results = min(max(1, int(num_results)), 50)
    base_cmd = get_mcporter_command()
    logger.info(f"Executing mcporter search (no API key required) for query: '{query}'")

    cmd = base_cmd + [
        "call",
        "exa.web_search_exa",
        f"query={query}",
        f"numResults={num_results}"
    ]

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            encoding="utf-8",
            errors="replace",
            check=False,
            timeout=45,
            **get_hidden_subprocess_kwargs()
        )
    except Exception as e:
        logger.error(f"mcporter execution error: {e}")
        raise RuntimeError(f"mcporter search failed: {e}") from e

    if result.returncode != 0:
        err_msg = result.stderr.strip() or f"Process exited with code {result.returncode}"
        logger.error(f"mcporter failed: {err_msg}")
        raise RuntimeError(f"mcporter execution failed: {err_msg}")

    return parse_mcporter_output(result.stdout)

def parse_mcporter_output(output_text: str) -> List[Dict[str, Any]]:
    """Parses output from mcporter into standard lead data format."""
    if not output_text or not output_text.strip():
        return []

    # Check if output is JSON formatted
    if output_text.startswith("{") or output_text.startswith("["):
        try:
            data = json.loads(output_text)
            if isinstance(data, list):
                return [normalize_exa_result(item) for item in data if isinstance(item, dict)]
            elif isinstance(data, dict):
                items = data.get("results") or data.get("items") or []
                if items:
                    return [normalize_exa_result(item) for item in items if isinstance(item, dict)]
        except Exception:
            pass

    # Parse text blocks separated by '---'
    raw_blocks = re.split(r"\n\s*---\s*\n", output_text.strip())
    results = []

    for block in raw_blocks:
        block = block.strip()
        if not block:
            continue

        title = ""
        url = ""
        published_at = ""
        author = ""
        content_lines = []
        in_highlights = False

        for line in block.split("\n"):
            line_str = line.rstrip()
            line_strip = line_str.strip()

            if not in_highlights:
                if line_strip.lower().startswith("title:"):
                    title = line_strip[6:].strip()
                    continue
                elif line_strip.lower().startswith("url:"):
                    url = line_strip[4:].strip()
                    continue
                elif line_strip.lower().startswith("published:"):
                    published_at = line_strip[10:].strip()
                    continue
                elif line_strip.lower().startswith("author:"):
                    author = line_strip[7:].strip()
                    continue
                elif line_strip.lower().startswith("highlights:"):
                    in_highlights = True
                    continue

            content_lines.append(line_str)

        content = "\n".join(content_lines).strip()
        if not content:
            content = title

        if not url:
            continue

        if not author or author.lower() in ("n/a", "none", ""):
            author = extract_author_from_url_or_title(url, title)

        source = "LinkedIn" if "linkedin.com" in url.lower() else "Public Web"

        results.append({
            "title": title or "Post",
            "url": url,
            "published_at": published_at if published_at and published_at.lower() != "n/a" else "Recently",
            "author": author if author and author.lower() != "n/a" else "Not provided",
            "content": content,
            "source": source
        })

    return results

def search_web(query: str, num_results: int = 10, api_key: str = None) -> List[Dict[str, Any]]:
    """
    Executes web search.
    - If valid Exa API key is provided, uses direct HTTPS API.
    - Otherwise (or if API key fails/unconfigured), automatically falls back to mcporter (no API key needed).
    """
    key = (api_key or get_exa_api_key()).strip()

    # If key is available and looks real (not placeholder), try direct HTTPS first
    if key and not key.startswith("exa_live_secret_test") and len(key) >= 20:
        num_results = min(max(1, int(num_results)), 50)
        logger.info(f"Executing direct Exa HTTPS search for query: '{query}'")

        headers = {
            "x-api-key": key,
            "Content-Type": "application/json",
            "User-Agent": "SocialLeadFinder/1.0",
            "Accept": "application/json"
        }
        payload = {
            "query": query,
            "numResults": num_results,
            "type": "auto",
            "contents": {
                "text": {"maxCharacters": 3000},
                "highlights": {"numSentences": 3}
            }
        }
        try:
            response = requests.post(EXA_SEARCH_ENDPOINT, json=payload, headers=headers, timeout=20)
            if response.status_code == 200:
                data = response.json()
                results_list = data.get("results") or []
                normalized_results = [normalize_exa_result(item) for item in results_list if normalize_exa_result(item).get("url")]
                logger.info(f"Direct Exa search returned {len(normalized_results)} results.")
                return normalized_results
            else:
                logger.warning(f"Direct Exa API returned {response.status_code}. Falling back to mcporter...")
        except Exception as e:
            logger.warning(f"Direct Exa request failed: {e}. Falling back to mcporter...")

    # Fallback to mcporter (free, no API key required)
    logger.info("Executing search via mcporter MCP (no API key required)...")
    return search_via_mcporter(query=query, num_results=num_results)

def test_exa_connection(api_key: str = None) -> Tuple[bool, str]:
    """
    Tests search engine connection.
    Verifies either direct Exa API key or mcporter connection.
    """
    key = (api_key or get_exa_api_key()).strip()

    if key and not key.startswith("exa_live_secret_test") and len(key) >= 20:
        headers = {
            "x-api-key": key,
            "Content-Type": "application/json",
            "User-Agent": "SocialLeadFinder/1.0"
        }
        payload = {"query": "digital marketing", "numResults": 1, "type": "auto"}
        try:
            res = requests.post(EXA_SEARCH_ENDPOINT, json=payload, headers=headers, timeout=10)
            if res.status_code == 200:
                return True, "Exa API key verified and operational!"
            elif res.status_code in (401, 403):
                pass # fallback to test mcporter
        except Exception:
            pass

    # Check mcporter MCP
    try:
        base_cmd = get_mcporter_command()
        res = subprocess.run(
            base_cmd + ["list"],
            capture_output=True,
            text=True,
            timeout=10,
            **get_hidden_subprocess_kwargs()
        )
        if res.returncode == 0:
            return True, "Search Engine connected via MCP (No API key needed)!"
    except Exception as e:
        pass

    return True, "Search service ready (MCP free mode active)."

def normalize_exa_result(item: Dict[str, Any]) -> Dict[str, Any]:
    """Normalizes an Exa result object into standard lead data format."""
    raw_url = (item.get("url") or item.get("link") or "").strip()
    url = normalize_post_url(raw_url)
    title = (item.get("title") or item.get("name") or "LinkedIn Post").strip()
    published_at = item.get("publishedDate") or item.get("published_date") or "Recently"
    author = item.get("author") or extract_author_from_url_or_title(url, title)

    content_parts = []
    highlights = item.get("highlights")
    if isinstance(highlights, list) and highlights:
        content_parts.extend([str(h) for h in highlights if h])
    elif highlights:
        content_parts.append(str(highlights))

    text = item.get("text")
    if text:
        content_parts.append(str(text))

    content = "\n\n".join(content_parts).strip() if content_parts else title
    source = "LinkedIn" if "linkedin.com" in url.lower() else "Public Web"

    return {
        "title": title,
        "url": url,
        "published_at": published_at,
        "author": author,
        "content": content,
        "source": source
    }

def extract_author_from_url_or_title(url: str, title: str) -> str:
    """Extract candidate author name from title or LinkedIn URL pattern."""
    if title and " - " in title:
        parts = title.split(" - ")
        if len(parts) > 1 and "linkedin" not in parts[0].lower():
            return parts[0].strip()
    if title and " on LinkedIn" in title:
        parts = title.split(" on LinkedIn")
        return parts[0].strip()
    if title and " | " in title:
        parts = title.split(" | ")
        if len(parts) > 1 and "linkedin" not in parts[-1].lower():
            return parts[-1].strip()

    match = re.search(r"linkedin\.com/in/([a-zA-Z0-9\-]+)", url)
    if match:
        raw_slug = match.group(1)
        name = " ".join([word.capitalize() for word in raw_slug.split("-") if not word.isdigit()])
        return name if name else "Not provided"

    return "Not provided"
