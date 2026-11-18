from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, autoincrement=True)
    source = Column(String(50), nullable=False, default="LinkedIn")
    source_id = Column(String(255), nullable=True, index=True)
    url = Column(String(1024), nullable=False, index=True)
    title = Column(String(512), nullable=True)
    author_name = Column(String(255), nullable=True, default="Not provided")
    author_role = Column(String(255), nullable=True, default="Not provided")
    company_name = Column(String(255), nullable=True, default="Company not provided", index=True)
    company_url = Column(String(1024), nullable=True, default="Not available")
    company_industry = Column(String(255), nullable=True, default="Not available")
    location = Column(String(255), nullable=True, default="Location not available")
    service = Column(String(255), nullable=False, index=True)
    matched_keywords = Column(Text, nullable=True)  # Comma-separated or JSON list
    content = Column(Text, nullable=True)
    published_at = Column(String(100), nullable=True, index=True)
    discovered_at = Column(DateTime, default=datetime.utcnow)
    status = Column(String(50), nullable=False, default="new", index=True)  # new, contacted, qualified, converted, rejected
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    notifications = relationship("NotificationLog", back_populates="lead", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "source": self.source,
            "source_id": self.source_id,
            "url": self.url,
            "title": self.title,
            "author_name": self.author_name,
            "author_role": self.author_role,
            "company_name": self.company_name,
            "company_url": self.company_url,
            "company_industry": self.company_industry,
            "location": self.location,
            "service": self.service,
            "matched_keywords": self.matched_keywords,
            "content": self.content,
            "published_at": self.published_at,
            "discovered_at": self.discovered_at.isoformat() if self.discovered_at else None,
            "status": self.status,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class SearchQuery(Base):
    __tablename__ = "search_queries"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    query = Column(Text, nullable=False)
    source = Column(String(50), nullable=False, default="LinkedIn")
    enabled = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    results_count = Column(Integer, default=0)
    leads_found_count = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "query": self.query,
            "source": self.source,
            "enabled": self.enabled,
            "last_run_at": self.last_run_at.isoformat() if self.last_run_at else None,
            "results_count": self.results_count,
            "leads_found_count": self.leads_found_count,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, autoincrement=True)
    key = Column(String(255), unique=True, nullable=False)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "key": self.key,
            "value": self.value,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

class NotificationLog(Base):
    __tablename__ = "notification_log"

    id = Column(Integer, primary_key=True, autoincrement=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    channel = Column(String(50), nullable=False)  # telegram, email
    status = Column(String(50), nullable=False)   # success, failed
    message_text = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)
    sent_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="notifications")

    def to_dict(self):
        return {
            "id": self.id,
            "lead_id": self.lead_id,
            "channel": self.channel,
            "status": self.status,
            "message_text": self.message_text,
            "error_message": self.error_message,
            "sent_at": self.sent_at.isoformat() if self.sent_at else None,
        }
