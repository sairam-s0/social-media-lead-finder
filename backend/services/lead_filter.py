import re
from typing import Dict, Any, Tuple, Optional, List

# Keywords that explicitly indicate a candidate seeking employment or internal job-seeking post
REJECT_KEYWORDS = [
    "looking for a job",
    "looking for work",
    "seeking employment",
    "job seeker",
    "my resume",
    "my cv",
    "i am looking for a job",
    "i am looking for work",
    "open to work",
    "open for work",
    "seeking a role",
    "hire me",
    "full-time position",
    "join our team as",
    "join our internal team",
]

# Keywords indicating positive client demand / business looking for services or hiring freelancers/agencies
POSITIVE_INTENT_KEYWORDS = [
    "looking for",
    "need",
    "seeking",
    "require",
    "required",
    "want",
    "searching for",
    "need help with",
    "looking to hire",
    "looking for an agency",
    "looking for a freelancer",
    "looking for a partner",
    "recommendations for",
    "any recommendation for",
    "who can help us",
    "hiring",
    "hire",
    "looking to outsource",
    "outsourcing",
]

# Known default service category mappings
SERVICE_KEYWORD_MAP = {
    "digital marketing agency": "Digital Marketing",
    "digital marketer": "Digital Marketing",
    "digital marketing": "Digital Marketing",
    "seo agency": "SEO",
    "seo services": "SEO",
    "seo": "SEO",
    "social media agency": "Social Media Marketing",
    "social media marketing": "Social Media Marketing",
    "social media manager": "Social Media Marketing",
    "performance marketing": "Performance Marketing",
    "google ads": "Performance Marketing",
    "meta ads": "Performance Marketing",
    "facebook ads": "Performance Marketing",
    "paid advertising": "Performance Marketing",
    "web development agency": "Web Development",
    "web development": "Web Development",
    "website development": "Web Development",
    "web developer": "Web Development",
    "website developer": "Web Development",
    "need a website": "Web Development",
    "graphic design": "Graphic Design",
    "graphic designer": "Graphic Design",
    "content marketing": "Content Marketing",
    "lead generation": "Lead Generation",
    "marketing automation": "Marketing Automation",
    "branding": "Branding",
    "video editing": "Video Production",
    "video editor": "Video Production",
    "copywriter": "Content Writing",
    "app development": "App Development",
    "app developer": "App Development",
}

def evaluate_lead_intent(text: str, custom_category: Optional[str] = None) -> Tuple[bool, Optional[str], List[str], Optional[str]]:
    """
    Evaluates whether text represents a valid service lead (positive intent) vs job-seeker candidate post.
    Dynamically supports all custom topics (graphic design, hiring, web dev, etc.).
    
    Returns:
        (is_lead: bool, service_category: Optional[str], matched_keywords: list, rejection_reason: Optional[str])
    """
    if not text:
        return False, None, [], "Empty content"

    text_lower = text.lower()

    # 1. Check for explicit job-seeker candidate rejection terms (e.g. "I am looking for a job")
    for reject in REJECT_KEYWORDS:
        if re.search(r'\b' + re.escape(reject) + r'\b', text_lower):
            return False, None, [], f"Matched job-seeker keyword: '{reject}'"

    # 2. Check for positive intent keyword
    matched_intents = []
    for positive in POSITIVE_INTENT_KEYWORDS:
        if re.search(r'\b' + re.escape(positive) + r'\b', text_lower):
            matched_intents.append(positive)

    # 3. Determine Service Category
    matched_service = custom_category
    matched_service_keywords = []

    sorted_service_terms = sorted(SERVICE_KEYWORD_MAP.keys(), key=len, reverse=True)
    for term in sorted_service_terms:
        if re.search(r'\b' + re.escape(term) + r'\b', text_lower):
            if not matched_service:
                matched_service = SERVICE_KEYWORD_MAP[term]
            matched_service_keywords.append(term)

    # Fallback to general category if intent matches or query was executed
    if not matched_service:
        matched_service = custom_category if custom_category else "General Service"

    all_matched = list(set(matched_intents + matched_service_keywords))
    if not all_matched:
        all_matched = ["service search"]

    return True, matched_service, all_matched, None
