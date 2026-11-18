from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from database.models import Lead
from utils.logging_config import logger

def normalize_url(url: str) -> str:
    """Normalize URL by stripping query parameters and trailing slashes."""
    if not url:
        return ""
    clean = url.split("?")[0].split("#")[0].rstrip("/")
    return clean.lower()

def check_and_save_lead(db: Session, lead_data: Dict[str, Any]) -> Tuple[Lead, bool]:
    """
    Checks if a lead exists by (source + source_id) or (source + normalized_url).
    If it exists, updates useful metadata and returns (lead_obj, is_new=False).
    If it does not exist, inserts it and returns (lead_obj, is_new=True).
    """
    source = lead_data.get("source", "LinkedIn")
    source_id = lead_data.get("source_id", "")
    url = lead_data.get("url", "")
    norm_url = normalize_url(url)

    existing_lead = None

    # 1. Primary check: source + source_id
    if source_id:
        existing_lead = db.query(Lead).filter(
            Lead.source == source,
            Lead.source_id == source_id
        ).first()

    # 2. Fallback check: source + normalized url matching
    if not existing_lead and url:
        all_source_leads = db.query(Lead).filter(Lead.source == source).all()
        for l in all_source_leads:
            if normalize_url(l.url) == norm_url:
                existing_lead = l
                break

    if existing_lead:
        logger.info(f"Duplicate lead detected for URL: {url}. Updating metadata.")
        # Update useful fields if newer or missing
        if lead_data.get("content") and len(lead_data["content"]) > len(existing_lead.content or ""):
            existing_lead.content = lead_data["content"]
        if existing_lead.company_name == "Company not provided" and lead_data.get("company_name") and lead_data.get("company_name") != "Company not provided":
            existing_lead.company_name = lead_data["company_name"]
        if existing_lead.location == "Location not available" and lead_data.get("location") and lead_data.get("location") != "Location not available":
            existing_lead.location = lead_data["location"]
        
        db.add(existing_lead)
        db.commit()
        db.refresh(existing_lead)
        return existing_lead, False

    # Insert new lead
    new_lead = Lead(**lead_data)
    db.add(new_lead)
    db.commit()
    db.refresh(new_lead)
    logger.info(f"Saved new lead ID {new_lead.id} ({new_lead.service} - {new_lead.company_name})")
    return new_lead, True
