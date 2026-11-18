import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from services.lead_filter import evaluate_lead_intent

def test_positive_lead_intent():
    post = "Looking for a digital marketing agency for our FMCG brand in Mumbai."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is True
    assert service == "Digital Marketing"
    assert "looking for" in keywords or "digital marketing agency" in keywords
    assert reason is None

def test_positive_meta_ads_lead():
    post = "We need someone to manage our Meta Ads and Google Ads campaigns."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is True
    assert service == "Performance Marketing"

def test_job_seeker_rejection():
    post = "I am a digital marketer looking for a job. Here is my resume."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is False
    assert "Matched job-seeker keyword" in reason

def test_internal_hiring_rejection():
    post = "We are looking for a digital marketer to join our team as full-time position."
    is_lead, service, keywords, reason = evaluate_lead_intent(post)
    assert is_lead is False
    assert "Matched job-seeker keyword" in reason
