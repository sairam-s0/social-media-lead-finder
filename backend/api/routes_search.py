from flask import Blueprint, request, jsonify
from datetime import datetime
from database.db import get_db
from database.models import SearchQuery
from services.exa_service import search_web
from services.scheduler import run_search_pipeline
from utils.logging_config import logger

bp_search = Blueprint("search", __name__, url_prefix="/api")

@bp_search.route("/search", methods=["POST"])
def adhoc_search():
    data = request.get_json() or {}
    query = (data.get("query") or "").strip()[:500]
    
    try:
        raw_num = int(data.get("num_results", 10))
        num_results = min(max(1, raw_num), 50)  # Server-side capping max 50
    except (ValueError, TypeError):
        num_results = 10

    if not query:
        return jsonify({"success": False, "error": "Query string is required"}), 400

    try:
        results = search_web(query=query, num_results=num_results)
        return jsonify({
            "success": True,
            "query": query,
            "count": len(results),
            "results": results
        }), 200
    except Exception as e:
        logger.error(f"Search API execution failed: {e}")
        return jsonify({
            "success": False,
            "error": "search_execution_failed",
            "details": str(e)
        }), 500

@bp_search.route("/search/run", methods=["POST"])
def run_full_pipeline():
    data = request.get_json() or {}
    query_id = data.get("query_id")
    custom_query = (data.get("custom_query") or "").strip()[:500] if data.get("custom_query") else None
    result_metrics = run_search_pipeline(query_id=query_id, custom_query=custom_query)
    return jsonify(result_metrics), 200

# CRUD Search Queries
@bp_search.route("/search-queries", methods=["GET"])
def get_search_queries():
    with get_db() as db:
        queries = db.query(SearchQuery).order_by(SearchQuery.created_at.desc()).all()
        return jsonify({
            "success": True,
            "search_queries": [q.to_dict() for q in queries]
        }), 200

@bp_search.route("/search-queries", methods=["POST"])
def create_search_query():
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()[:200]
    query = (data.get("query") or "").strip()[:1000]
    source = (data.get("source") or "LinkedIn").strip()[:50]
    enabled = bool(data.get("enabled", True))

    if not name or not query:
        return jsonify({"success": False, "error": "Name and query string are required"}), 400

    with get_db() as db:
        new_q = SearchQuery(name=name, query=query, source=source, enabled=enabled)
        db.add(new_q)
        db.commit()
        db.refresh(new_q)
        return jsonify({"success": True, "search_query": new_q.to_dict()}), 201

@bp_search.route("/search-queries/<int:query_id>", methods=["PATCH"])
def update_search_query(query_id):
    data = request.get_json() or {}

    with get_db() as db:
        q = db.query(SearchQuery).filter_by(id=query_id).first()
        if not q:
            return jsonify({"success": False, "error": "Search query not found"}), 404

        if "name" in data:
            q.name = (data["name"] or "").strip()[:200]
        if "query" in data:
            q.query = (data["query"] or "").strip()[:1000]
        if "source" in data:
            q.source = (data["source"] or "").strip()[:50]
        if "enabled" in data:
            q.enabled = bool(data["enabled"])

        q.updated_at = datetime.utcnow()
        db.add(q)
        db.commit()
        db.refresh(q)
        return jsonify({"success": True, "search_query": q.to_dict()}), 200

@bp_search.route("/search-queries/<int:query_id>", methods=["DELETE"])
def delete_search_query(query_id):
    with get_db() as db:
        q = db.query(SearchQuery).filter_by(id=query_id).first()
        if not q:
            return jsonify({"success": False, "error": "Search query not found"}), 404

        db.delete(q)
        db.commit()
        return jsonify({"success": True, "message": "Search query deleted"}), 200
