from flask import Blueprint, jsonify
from datetime import datetime, timedelta
from sqlalchemy import func
from database.db import get_db
from database.models import Lead

bp_stats = Blueprint("stats", __name__, url_prefix="/api/stats")

@bp_stats.route("", methods=["GET"])
def get_stats():
    now = datetime.utcnow()
    today_start = datetime(now.year, now.month, now.day)
    week_start = today_start - timedelta(days=now.weekday())

    with get_db() as db:
        total_leads = db.query(Lead).count()
        new_leads = db.query(Lead).filter(Lead.status == "new").count()
        contacted_leads = db.query(Lead).filter(Lead.status == "contacted").count()
        qualified_leads = db.query(Lead).filter(Lead.status == "qualified").count()
        converted_leads = db.query(Lead).filter(Lead.status == "converted").count()
        rejected_leads = db.query(Lead).filter(Lead.status == "rejected").count()

        today_leads = db.query(Lead).filter(Lead.discovered_at >= today_start).count()
        this_week_leads = db.query(Lead).filter(Lead.discovered_at >= week_start).count()

        # Breakdown by service
        service_rows = db.query(Lead.service, func.count(Lead.id)).group_by(Lead.service).all()
        by_service = [{"service": r[0] or "Unknown", "count": r[1]} for r in service_rows]

        # Breakdown by source
        source_rows = db.query(Lead.source, func.count(Lead.id)).group_by(Lead.source).all()
        by_source = [{"source": r[0] or "Unknown", "count": r[1]} for r in source_rows]

        # Breakdown by status
        by_status = [
            {"status": "new", "count": new_leads},
            {"status": "contacted", "count": contacted_leads},
            {"status": "qualified", "count": qualified_leads},
            {"status": "converted", "count": converted_leads},
            {"status": "rejected", "count": rejected_leads},
        ]

        # Leads over last 7 days
        over_time = []
        for i in range(6, -1, -1):
            day_date = (now - timedelta(days=i)).date()
            day_start_dt = datetime(day_date.year, day_date.month, day_date.day)
            day_end_dt = day_start_dt + timedelta(days=1)
            cnt = db.query(Lead).filter(Lead.discovered_at >= day_start_dt, Lead.discovered_at < day_end_dt).count()
            over_time.append({
                "date": day_date.strftime("%b %d"),
                "leads": cnt
            })

        return jsonify({
            "success": True,
            "total_leads": total_leads,
            "new_leads": new_leads,
            "contacted_leads": contacted_leads,
            "qualified_leads": qualified_leads,
            "converted_leads": converted_leads,
            "today": today_leads,
            "this_week": this_week_leads,
            "by_service": by_service,
            "by_source": by_source,
            "by_status": by_status,
            "over_time": over_time
        }), 200
