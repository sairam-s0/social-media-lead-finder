import re
from typing import Dict, Any

def normalize_post_url(url: str) -> str:
    """
    Normalizes social post URLs to canonical, directly clickable links.
    - Ensures valid protocol (https://)
    - Converts LinkedIn post URLs with activity IDs into canonical feed update URLs:
      https://www.linkedin.com/feed/update/urn:li:activity:<activity_id>/
      which reliably open across all platforms (desktop browser & mobile LinkedIn app)
      and avoid 404s caused by outdated slugs or tracking hashes (-9xND).
    - Cleans tracking parameters (?utm_source=..., etc.)
    """
    if not url or not isinstance(url, str):
        return ""
    clean = url.strip().strip("\"'")
    if not clean:
        return ""

    if not clean.startswith(("http://", "https://")):
        clean = "https://" + clean

    # LinkedIn normalizer
    if "linkedin.com" in clean.lower():
        act_match = re.search(r"activity[-:](?:urn:li:activity:)?(\d+)", clean)
        if act_match:
            return f"https://www.linkedin.com/feed/update/urn:li:activity:{act_match.group(1)}/"
        urn_match = re.search(r"urn:li:(?:activity|share):(\d+)", clean)
        if urn_match:
            return f"https://www.linkedin.com/feed/update/urn:li:activity:{urn_match.group(1)}/"

    # Strip query tracking parameters and trailing slashes for clean URLs
    clean = clean.split("?")[0].rstrip("/")
    return clean

def parse_lead_data(raw_item: Dict[str, Any], matched_service: str, matched_keywords: list) -> Dict[str, Any]:
    """
    Parses a raw Exa result into structured Lead fields, extracting company name, author, location, and role.
    Strictly avoids hallucination.
    """
    raw_url = raw_item.get("url", "")
    url = normalize_post_url(raw_url)
    title = raw_item.get("title", "")
    content = raw_item.get("content", "") or title
    author = raw_item.get("author", "Not provided")
    published_at = raw_item.get("published_at", "Recently")
    source = raw_item.get("source", "LinkedIn")

    # Generate source_id from URL
    source_id = extract_source_id(url)

    # Extract author name and role if available
    author_name, author_role = parse_author_and_role(author, title, content)

    # Extract company information strictly if present
    company_name, company_url, company_industry = parse_company_info(title, content, author_role)

    # Extract location if mentioned
    location = parse_location(content, title)

    return {
        "source": source,
        "source_id": source_id,
        "url": url,
        "title": title,
        "author_name": author_name,
        "author_role": author_role,
        "company_name": company_name,
        "company_url": company_url,
        "company_industry": company_industry,
        "location": location,
        "service": matched_service,
        "matched_keywords": ", ".join(matched_keywords),
        "content": content,
        "published_at": published_at,
        "status": "new",
        "notes": ""
    }

def extract_source_id(url: str) -> str:
    """Extract unique post ID or normalized slug from URL."""
    if not url:
        return ""
    # E.g. linkedin.com/posts/username-activity-1234567890 or urn:li:activity:1234567890
    match = re.search(r"(?:activity[-:](?:urn:li:activity:)?|urn:li:(?:activity|share):)(\d+)", url)
    if match:
        return match.group(1)
    
    # Hash or fallback URL path slug
    clean_url = url.split("?")[0].rstrip("/")
    parts = clean_url.split("/")
    return parts[-1] if parts else url

def parse_author_and_role(author_raw: str, title: str, content: str) -> tuple[str, str]:
    author_name = author_raw if author_raw and author_raw != "Not provided" else "Not provided"
    author_role = "Not provided"

    # Try title pattern: "Name - Role/Company | LinkedIn"
    if title and " - " in title:
        parts = title.split(" - ")
        if len(parts) >= 2:
            potential_name = parts[0].strip()
            potential_role = parts[1].split("|")[0].split("on LinkedIn")[0].strip()
            if author_name == "Not provided" and potential_name and "linkedin" not in potential_name.lower():
                author_name = potential_name
            if potential_role and "linkedin" not in potential_role.lower():
                author_role = potential_role

    # Pattern match headlines in content (e.g. "Founder at XYZ", "Marketing Director")
    if author_role == "Not provided" and content:
        headline_match = re.search(r'\b(Founder|CEO|Co-Founder|Director|Manager|Head of \w+|VP|Owner|Partner)\b[^.\n,]*', content, re.IGNORECASE)
        if headline_match:
            author_role = headline_match.group(0).strip()

    return author_name, author_role

def parse_company_info(title: str, content: str, author_role: str) -> tuple[str, str, str]:
    company_name = "Company not provided"
    company_url = "Not available"
    company_industry = "Not available"

    # Look for "at <Company>" patterns in title or headline
    text_to_search = f"{title}\n{author_role}\n{content[:300]}"
    
    # Match patterns like "Founder at Acme Corp" or "CEO @ TechLabs"
    at_match = re.search(r'\b(?:at|@|for)\s+([A-Z][A-Za-z0-9\s&\.\-]{2,30})\b', text_to_search)
    if at_match:
        candidate = at_match.group(1).strip()
        # Ensure candidate is not a common noun or LinkedIn word
        if candidate.lower() not in ["our team", "a company", "an agency", "linkedin", "my company", "the company", "us"]:
            company_name = candidate

    # Look for domain names in content
    domain_match = re.search(r'\b(?:https?://)?(?:www\.)?([a-zA-Z0-9\-]+\.(?:com|co|io|org|net|in))\b', content)
    if domain_match:
        domain = domain_match.group(1).lower()
        if "linkedin" not in domain and "twitter" not in domain and "facebook" not in domain:
            company_url = f"https://{domain}"
            if company_name == "Company not provided":
                # Convert domain prefix to company name (e.g., acmefoods.com -> Acmefoods)
                comp_prefix = domain.split(".")[0]
                company_name = comp_prefix.capitalize()

    return company_name, company_url, company_industry

def parse_location(content: str, title: str) -> str:
    # Common location patterns in posts (e.g. "based in London", "operating from Mumbai", "in New York")
    loc_match = re.search(r'\b(?:based in|located in|operating from|hiring in|in)\s+([A-Z][a-zA-Z\s]{2,20})\b', f"{title} {content}")
    if loc_match:
        cand = loc_match.group(1).strip()
        if cand.lower() not in ["our team", "the us", "this post", "search", "need", "digital", "social", "india", "usa"]:
            return cand
    return "Location not available"
