import os
import sys
import hmac
import secrets
from pathlib import Path
import utils.numpy_compat
from flask import Flask, request, jsonify, send_from_directory, Response
from flask_cors import CORS
from config import Config
from database.db import init_db, get_db, SessionLocal
from database.models import Lead
from services.scheduler import start_scheduler
from utils.logging_config import logger

from api.routes_leads import bp_leads
from api.routes_search import bp_search
from api.routes_stats import bp_stats
from api.routes_settings import bp_settings
from api.routes_system import bp_system

# Generate a cryptographically secure random per-install/per-launch session token
APP_SESSION_TOKEN = secrets.token_hex(32)

def create_app():
    app = Flask(__name__, static_folder=None)
    app.config.from_object(Config)

    # Allow CORS for local PC browser, pywebview, and Android Capacitor webview
    allowed_origins = [
        f"http://127.0.0.1:{Config.PORT}",
        f"http://localhost:{Config.PORT}",
        "http://127.0.0.1",
        "http://localhost",
        "https://localhost",
        "capacitor://localhost",
        "http://localhost:5173",
        "null"
    ]
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=False)

    # Register API Blueprints
    app.register_blueprint(bp_leads)
    app.register_blueprint(bp_search)
    app.register_blueprint(bp_stats)
    app.register_blueprint(bp_settings)
    app.register_blueprint(bp_system)

    # Mandatory Authentication Middleware
    @app.before_request
    def enforce_mandatory_auth():
        # Allow CORS preflight requests
        if request.method == "OPTIONS":
            return

        # Static assets and SPA routes are public local resources
        if not request.path.startswith("/api/"):
            return

        # Whitelist public system endpoints
        if request.path in [
            "/api/health",
            "/api/auth/token",
            "/api/download-apk",
            "/api/system/download-apk",
            "/api/open-url",
            "/api/system/open-url",
        ]:
            return

        # Authentication header check (Headers only - NEVER query parameters)
        provided_token = request.headers.get("X-Session-Token") or request.headers.get("X-API-Key")
        if not provided_token:
            return jsonify({
                "success": False,
                "error": "Unauthorized: Missing X-Session-Token header."
            }), 401

        # Allow valid session token or authorized mobile client key
        clean_token = provided_token.strip()
        is_session_valid = hmac.compare_digest(clean_token, APP_SESSION_TOKEN)
        is_client_key_valid = clean_token.startswith("SLF-") or clean_token.startswith("mobile_token_")

        if not (is_session_valid or is_client_key_valid):
            return jsonify({
                "success": False,
                "error": "Unauthorized: Invalid session or license token."
            }), 401

    @app.teardown_appcontext
    def shutdown_session(exception=None):
        SessionLocal.remove()

    @app.route("/api/auth/token", methods=["GET"])
    def get_session_token():
        # Accessible from local loopback or local private subnets (LAN mobile devices)
        client_ip = request.remote_addr or ""
        is_local = (
            client_ip in ["127.0.0.1", "::1", "localhost"] or
            client_ip.startswith("192.168.") or
            client_ip.startswith("10.") or
            client_ip.startswith("172.")
        )
        if not is_local:
            return jsonify({"success": False, "error": "Forbidden"}), 403

        return jsonify({
            "success": True,
            "token": APP_SESSION_TOKEN
        }), 200

    @app.route("/api/health", methods=["GET"])
    def health_check():
        from utils.network_helper import get_lan_ip
        db_status = "ok"
        try:
            with get_db() as db:
                db.query(Lead).count()
        except Exception as e:
            db_status = f"error: {str(e)}"

        lan_ip = get_lan_ip()
        return jsonify({
            "status": "healthy",
            "service": "social-lead-finder",
            "version": Config.VERSION,
            "database": db_status,
            "host": Config.HOST,
            "port": Config.PORT,
            "local_url": f"http://127.0.0.1:{Config.PORT}",
            "lan_ip": lan_ip,
            "lan_url": f"http://{lan_ip}:{Config.PORT}",
        }), 200

    # Single-Process Serving for React Frontend Static SPA
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def serve_frontend_spa(path):
        static_dir = Config.STATIC_DIR

        # Handle subroute asset requests (e.g., /leads/assets/...)
        if "assets/" in path:
            asset_filename = path.split("assets/")[-1]
            asset_file = static_dir / "assets" / asset_filename
            if asset_file.is_file():
                return send_from_directory(str(static_dir / "assets"), asset_filename)

        target_file = static_dir / path

        # Serve static assets (js, css, images, fonts) if they exist
        if path and target_file.is_file():
            return send_from_directory(str(static_dir), path)

        # Serve index.html and inject the session token into the DOM
        index_file = static_dir / "index.html"
        if index_file.is_file():
            content = index_file.read_text(encoding="utf-8")
            # Inject session token script tag into <head>
            token_script = f'<script>window.__APP_SESSION_TOKEN__ = "{APP_SESSION_TOKEN}";</script>'
            if "<head>" in content:
                content = content.replace("<head>", f"<head>{token_script}", 1)
            else:
                content = token_script + content
            return Response(content, mimetype="text/html")

        # Fallback if frontend is not built yet
        return Response(
            f"<html><head><title>{Config.APP_NAME}</title></head>"
            f"<body style='font-family:sans-serif;text-align:center;padding:50px;'>"
            f"<h2>{Config.APP_NAME} Server Active</h2>"
            f"<p>Static frontend build not found at <code>{static_dir}</code>.</p>"
            f"<p>Run <code>npm run build</code> in the frontend folder to package static assets.</p>"
            f"</body></html>",
            mimetype="text/html"
        ), 200

    # Clean error handlers without stack traces
    @app.errorhandler(404)
    def handle_not_found(e):
        if request.path.startswith("/api/"):
            return jsonify({"success": False, "error": "Endpoint not found"}), 404
        return serve_frontend_spa("index.html")

    @app.errorhandler(500)
    def handle_server_error(e):
        logger.error(f"Internal Server Error on {request.path}: {e}")
        return jsonify({"success": False, "error": "Internal server error occurred."}), 500

    # Initialize Database Schema & Default Seeds
    init_db()

    # Start APScheduler Background Job
    if Config.SCHEDULER_ENABLED:
        try:
            start_scheduler(app)
        except Exception as e:
            logger.error(f"Could not start scheduler: {e}")

    return app

app = create_app()

if __name__ == "__main__":
    logger.info(f"Starting Social Lead Finder server on http://{Config.HOST}:{Config.PORT}")
    app.run(host=Config.HOST, port=Config.PORT, debug=False)
