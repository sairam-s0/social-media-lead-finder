from flask import Blueprint, request, jsonify
from services.licensing import LicensingManager
from services.updater import check_for_updates
from utils.logging_config import logger

bp_system = Blueprint("system", __name__, url_prefix="/api")

@bp_system.route("/license/status", methods=["GET"])
def license_status():
    status_data = LicensingManager.get_status()
    return jsonify(status_data), 200

@bp_system.route("/license/activate", methods=["POST"])
def license_activate():
    data = request.get_json() or {}
    license_key = (data.get("license_key") or "").strip()
    client_name = (data.get("client_name") or "").strip()

    if not license_key:
        return jsonify({"success": False, "error": "License key is required."}), 400

    success, message = LicensingManager.activate(license_key, client_name)
    return jsonify({
        "success": success,
        "message": message,
        "status": LicensingManager.get_status()
    }), 200 if success else 400

@bp_system.route("/updates/check", methods=["GET"])
def check_updates_endpoint():
    update_info = check_for_updates()
    return jsonify(update_info), 200

@bp_system.route("/download-apk", methods=["GET"])
@bp_system.route("/system/download-apk", methods=["GET"])
def download_apk():
    import sys
    from flask import send_from_directory
    from pathlib import Path
    from config import Config

    candidates = [
        Config.PROJECT_ROOT / "android_dist" / "lead-finder-v2.apk",
        Config.STATIC_DIR.parent / "android_dist" / "lead-finder-v2.apk",
        Path(__file__).resolve().parent.parent.parent / "android_dist" / "lead-finder-v2.apk",
        Path(sys.executable).parent / "lead-finder-v2.apk",
        Path(sys.executable).parent / "mobile" / "lead-finder-v2.apk",
    ]
    for apk_path in candidates:
        if apk_path.is_file():
            return send_from_directory(
                str(apk_path.parent),
                apk_path.name,
                as_attachment=True,
                download_name="LeadFinder-v2.apk"
            )
    return jsonify({"success": False, "error": "Android APK package not found on host."}), 404

@bp_system.route("/open-url", methods=["POST"])
@bp_system.route("/system/open-url", methods=["POST"])
def open_system_url():
    """
    Opens an external URL safely in the host system's default web browser
    (Google Chrome, Microsoft Edge, etc.) without navigating away the desktop app.
    """
    data = request.get_json() or {}
    url = (data.get("url") or "").strip()
    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return jsonify({"success": False, "error": "Invalid or unsafe URL protocol."}), 400

    try:
        import webbrowser
        webbrowser.open(url)
        logger.info(f"Opened external URL in system browser: {url}")
        return jsonify({"success": True}), 200
    except Exception as e:
        logger.error(f"Failed to open external URL in system browser: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

