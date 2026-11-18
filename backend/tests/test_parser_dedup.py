import pytest
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base, Lead
from services.lead_parser import parse_lead_data
from services.deduplicator import check_and_save_lead

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()

def test_parse_lead_data():
    raw_item = {
        "title": "Neel Sinha - Founder at ABC Foods | LinkedIn",
        "url": "https://linkedin.com/posts/neel-sinha-activity-1234567890",
        "author": "Neel Sinha",
        "published_at": "2 hours ago",
        "content": "Looking for a Digital Marketing agency operating from Mumbai.",
        "source": "LinkedIn"
    }

    parsed = parse_lead_data(raw_item, "Digital Marketing", ["looking for", "digital marketing agency"])
    assert parsed["author_name"] == "Neel Sinha"
    assert parsed["author_role"] == "Founder at ABC Foods"
    assert parsed["company_name"] == "ABC Foods"
    assert parsed["location"] == "Mumbai"
    assert parsed["service"] == "Digital Marketing"
    assert parsed["source_id"] == "1234567890"

def test_deduplication_prevention(db_session):
    lead_data = {
        "source": "LinkedIn",
        "source_id": "9999",
        "url": "https://linkedin.com/posts/test-lead-9999",
        "title": "Need SEO Services",
        "author_name": "Test User",
        "service": "SEO",
        "content": "Need SEO Services immediately"
    }

    # First insertion
    lead1, is_new1 = check_and_save_lead(db_session, lead_data)
    assert is_new1 is True
    assert db_session.query(Lead).count() == 1

    # Duplicate insertion attempt
    lead2, is_new2 = check_and_save_lead(db_session, lead_data)
    assert is_new2 is False
    assert db_session.query(Lead).count() == 1
    assert lead1.id == lead2.id
