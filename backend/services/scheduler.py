import traceback
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from database.db import get_db
from database.models import SearchQuery, Setting
from services.exa_service import search_web
from services.lead_filter import evaluate_lead_intent
from services.lead_parser import parse_lead_data
from services.deduplicator import check_and_save_lead
from services.notification_service import send_telegram_notification
from utils.logging_config import logger

scheduler = BackgroundScheduler(daemon=True)

def safe_scheduled_job_wrapper():
    """
    Catches any top-level exceptions so a background failure NEVER terminates the scheduler.
    """
    try:
        logger.info("Executing periodic automated lead search pipeline...")
        run_search_pipeline()
    except Exception as e:
        logger.error(f"Unhandled exception in scheduled lead search job: {e}\n{traceback.format_exc()}")

def run_search_pipeline(query_id: int = None, custom_query: str = None) -> dict:
    """
    Runs the lead discovery pipeline.
    - If custom_query is provided, executes ONLY that typed query string.
    - If query_id is provided, executes ONLY that specific configured query.
    - Otherwise, executes all ENABLED search queries.
    - Fault-tolerant: if one query encounters an error (e.g. invalid syntax or network blip),
      it logs the error and continues to the next query without aborting the entire run.
    """
    logger.info(f"--- Starting Search Pipeline (query_id={query_id}, custom_query='{custom_query}') ---")
    start_time = datetime.utcnow()

    total_results_fetched = 0
    total_new_leads_found = 0
    queries_processed = 0
    errors_encountered = []
    new_leads_list = []

    with get_db() as db:
        queries_to_run = []

        if custom_query and custom_query.strip():
            raw_q = custom_query.strip()
            # If user typed plain text without site operator, format nicely for LinkedIn post discovery
            formatted_q = raw_q if "site:" in raw_q else f'site:linkedin.com/posts "{raw_q}"'
            queries_to_run.append({
                "id": None,
                "name": f"Custom: {raw_q[:30]}",
                "query": formatted_q,
                "source": "LinkedIn"
            })
        elif query_id:
            q_obj = db.query(SearchQuery).filter_by(id=query_id).first()
            if q_obj:
                queries_to_run.append({
                    "id": q_obj.id,
                    "name": q_obj.name,
                    "query": q_obj.query,
                    "source": q_obj.source,
                    "model": q_obj
                })
        else:
            enabled_objs = db.query(SearchQuery).filter_by(enabled=True).all()
            for q_obj in enabled_objs:
                queries_to_run.append({
                    "id": q_obj.id,
                    "name": q_obj.name,
                    "query": q_obj.query,
                    "source": q_obj.source,
                    "model": q_obj
                })

        for q in queries_to_run:
            logger.info(f"Processing Search Query '{q['name']}': {q['query']}")
            try:
                # Isolated execution per query
                raw_items = search_web(query=q['query'], num_results=10)
                total_results_fetched += len(raw_items)
                new_leads_for_query = 0

                for raw_item in raw_items:
                    try:
                        content_to_check = f"{raw_item.get('title', '')} {raw_item.get('content', '')}"
                        is_lead, matched_service, matched_keywords, reject_reason = evaluate_lead_intent(
                            content_to_check,
                            custom_category=q.get('name')
                        )

                        if is_lead and matched_service:
                            lead_data = parse_lead_data(raw_item, matched_service, matched_keywords)
                            saved_lead, is_new = check_and_save_lead(db, lead_data)

                            if is_new:
                                new_leads_for_query += 1
                                total_new_leads_found += 1
                                new_leads_list.append(saved_lead)
                                try:
                                    send_telegram_notification(db, saved_lead)
                                except Exception as notify_err:
                                    logger.warning(f"Telegram notification dispatch error for lead {saved_lead.id}: {notify_err}")
                        else:
                            logger.debug(f"Filtered out post '{raw_item.get('url')}': {reject_reason}")
                    except Exception as item_err:
                        logger.warning(f"Error parsing result item '{raw_item.get('url')}': {item_err}")
                        continue

                # Update stats if bound to DB model
                if q.get("model"):
                    q_model = q["model"]
                    q_model.last_run_at = datetime.utcnow()
                    q_model.results_count = (q_model.results_count or 0) + len(raw_items)
                    q_model.leads_found_count = (q_model.leads_found_count or 0) + new_leads_for_query
                    db.add(q_model)
                    db.commit()

                queries_processed += 1

            except Exception as query_exc:
                err_text = f"Query '{q['name']}' encountered error: {str(query_exc)}"
                logger.error(err_text)
                errors_encountered.append(err_text)
                # DO NOT ABORT - continue immediately to the next query!
                continue

    # Dispatch Automated Email Report with Excel attachment if new leads were found and email is enabled
    if total_new_leads_found > 0:
        try:
            with get_db() as db:
                email_enabled_setting = db.query(Setting).filter_by(key="email_enabled").first()
                if email_enabled_setting and email_enabled_setting.value.lower() == "true":
                    from services.email_service import send_leads_report_email
                    logger.info(f"Auto-dispatching email report with {total_new_leads_found} new leads in Excel attachment...")
                    send_leads_report_email(leads=new_leads_list, subject=f"🔥 New Leads Discovered ({total_new_leads_found}) - {datetime.utcnow().strftime('%Y-%m-%d')}")
        except Exception as mail_err:
            logger.warning(f"Automated email report dispatch failed: {mail_err}")

    duration_sec = (datetime.utcnow() - start_time).total_seconds()
    logger.info(
        f"--- Finished Search Pipeline in {duration_sec:.2f}s --- "
        f"(Queries: {queries_processed}/{len(queries_to_run)}, Results: {total_results_fetched}, "
        f"New Leads: {total_new_leads_found}, Errors: {len(errors_encountered)})"
    )

    return {
        "success": True if not errors_encountered or queries_processed > 0 else False,
        "duration_seconds": round(duration_sec, 2),
        "queries_processed": queries_processed,
        "total_results": total_results_fetched,
        "new_leads_found": total_new_leads_found,
        "errors": errors_encountered,
        "executed_at": datetime.utcnow().isoformat()
    }

def start_scheduler(app=None):
    """
    Initializes and starts the APScheduler background job if enabled.
    """
    if scheduler.running:
        logger.info("Scheduler is already running.")
        return

    interval_minutes = 60
    with get_db() as db:
        interval_setting = db.query(Setting).filter_by(key="search_interval_minutes").first()
        if interval_setting and interval_setting.value.isdigit():
            interval_minutes = max(5, int(interval_setting.value))

    scheduler.add_job(
        func=safe_scheduled_job_wrapper,
        trigger="interval",
        minutes=interval_minutes,
        id="automated_lead_search_job",
        replace_existing=True,
        max_instances=1,
        coalesce=True
    )
    scheduler.start()
    logger.info(f"APScheduler started successfully. Job scheduled every {interval_minutes} minutes.")

def update_scheduler_interval(minutes: int):
    """
    Updates the interval for the scheduled search job dynamically.
    """
    if scheduler.running:
        safe_minutes = max(5, int(minutes))
        scheduler.reschedule_job("automated_lead_search_job", trigger="interval", minutes=safe_minutes)
        logger.info(f"Rescheduled search job to run every {safe_minutes} minutes.")
