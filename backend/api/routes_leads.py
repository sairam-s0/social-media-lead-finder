import io
import csv
from flask import Blueprint, request, jsonify, Response
from datetime import datetime
from database.db import get_db
from database.models import Lead, NotificationLog
from utils.logging_config import logger

bp_leads = Blueprint("leads", __name__, url_prefix="/api/leads")

ALLOWED_STATUSES = {"new", "contacted", "qualified", "converted", "rejected"}

@bp_leads.route("", methods=["GET"])
def get_leads():
    try:
        page = max(1, int(request.args.get("page", 1)))
    except (ValueError, TypeError):
        page = 1

    try:
        limit_param = int(request.args.get("limit", 20))
        limit = min(max(1, limit_param), 100)  # Server-side cap between 1 and 100
    except (ValueError, TypeError):
        limit = 20

    search = (request.args.get("search") or "").strip()[:100]
    service = (request.args.get("service") or "").strip()[:100]
    keyword = ((request.args.get("keyword") or "").strip() or service)[:100]
    source = (request.args.get("source") or "").strip()[:50]
    status = (request.args.get("status") or "").strip()[:30]
    location = (request.args.get("location") or "").strip()[:100]
    date_from = (request.args.get("date_from") or "").strip()[:30]
    date_to = (request.args.get("date_to") or "").strip()[:30]

    with get_db() as db:
        query = db.query(Lead)

        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                (Lead.title.ilike(search_pattern)) |
                (Lead.content.ilike(search_pattern)) |
                (Lead.company_name.ilike(search_pattern)) |
                (Lead.author_name.ilike(search_pattern)) |
                (Lead.matched_keywords.ilike(search_pattern)) |
                (Lead.service.ilike(search_pattern))
            )

        if keyword:
            kw_pattern = f"%{keyword}%"
            query = query.filter(
                (Lead.service.ilike(kw_pattern)) |
                (Lead.matched_keywords.ilike(kw_pattern)) |
                (Lead.title.ilike(kw_pattern)) |
                (Lead.content.ilike(kw_pattern))
            )

        if source:
            query = query.filter(Lead.source.ilike(f"%{source}%"))
        if status and status in ALLOWED_STATUSES:
            query = query.filter(Lead.status == status)
        if location:
            query = query.filter(Lead.location.ilike(f"%{location}%"))

        if date_from:
            try:
                dt_from = datetime.fromisoformat(date_from)
                query = query.filter(Lead.discovered_at >= dt_from)
            except ValueError:
                pass

        if date_to:
            try:
                dt_to = datetime.fromisoformat(date_to)
                query = query.filter(Lead.discovered_at <= dt_to)
            except ValueError:
                pass

        total = query.count()
        leads = query.order_by(Lead.discovered_at.desc()).offset((page - 1) * limit).limit(limit).all()

        return jsonify({
            "success": True,
            "leads": [l.to_dict() for l in leads],
            "pagination": {
                "page": page,
                "limit": limit,
                "total": total,
                "total_pages": (total + limit - 1) // limit if limit > 0 else 1
            }
        }), 200

@bp_leads.route("/export", methods=["GET"])
def export_leads():
    """
    Data portability & GDPR/DPDP export endpoint.
    Exports lead records to CSV format.
    """
    export_format = request.args.get("format", "csv").lower()

    with get_db() as db:
        leads = db.query(Lead).order_by(Lead.discovered_at.desc()).all()

        if export_format == "json":
            return jsonify({
                "success": True,
                "exported_at": datetime.utcnow().isoformat(),
                "count": len(leads),
                "leads": [l.to_dict() for l in leads]
            }), 200

        if export_format in ["xlsx", "excel"]:
            from services.excel_exporter import generate_leads_excel_workbook
            excel_buffer = generate_leads_excel_workbook(leads)
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"social_leads_{timestamp}.xlsx"
            return Response(
                excel_buffer.getvalue(),
                mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f"attachment; filename={filename}"}
            )

        # CSV Export
        output = io.StringIO()
        writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)
        writer.writerow([
            "ID", "Source", "Company Name", "Contact Name", "Role",
            "Location", "Service", "Keywords", "URL", "Status",
            "Discovered At", "Notes", "Snippet"
        ])

        for lead in leads:
            writer.writerow([
                lead.id,
                lead.source,
                lead.company_name,
                lead.author_name,
                lead.author_role,
                lead.location,
                lead.service,
                lead.matched_keywords,
                lead.url,
                lead.status,
                lead.discovered_at.isoformat() if lead.discovered_at else "",
                (lead.notes or "").replace("\n", " "),
                ((lead.content or "")[:150]).replace("\n", " ")
            ])

        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"social_leads_export_{timestamp}.csv"

        return Response(
            output.getvalue(),
            mimetype="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

@bp_leads.route("/<int:lead_id>", methods=["GET"])
def get_lead_by_id(lead_id):
    with get_db() as db:
        lead = db.query(Lead).filter_by(id=lead_id).first()
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404
        return jsonify({"success": True, "lead": lead.to_dict()}), 200

@bp_leads.route("/<int:lead_id>", methods=["PATCH"])
def update_lead(lead_id):
    data = request.get_json() or {}

    with get_db() as db:
        lead = db.query(Lead).filter_by(id=lead_id).first()
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404

        if "status" in data:
            new_status = str(data["status"]).lower().strip()
            if new_status not in ALLOWED_STATUSES:
                return jsonify({"success": False, "error": f"Invalid status. Allowed: {list(ALLOWED_STATUSES)}"}), 400
            lead.status = new_status

        if "notes" in data:
            lead.notes = str(data["notes"])[:5000]

        lead.updated_at = datetime.utcnow()
        db.add(lead)
        db.commit()
        db.refresh(lead)

        return jsonify({"success": True, "lead": lead.to_dict()}), 200

@bp_leads.route("/<int:lead_id>", methods=["DELETE"])
def delete_lead(lead_id):
    """
    Deletes a lead and cascades related notification logs.
    Satisfies GDPR/DPDP right to erasure.
    """
    with get_db() as db:
        lead = db.query(Lead).filter_by(id=lead_id).first()
        if not lead:
            return jsonify({"success": False, "error": "Lead not found"}), 404

        # Delete associated logs if any
        db.query(NotificationLog).filter_by(lead_id=lead_id).delete()
        db.delete(lead)
        db.commit()
        logger.info(f"Lead ID {lead_id} permanently deleted (GDPR/DPDP erasure compliance).")

        return jsonify({"success": True, "message": f"Lead {lead_id} deleted successfully."}), 200
