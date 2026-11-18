from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from config import Config
from database.models import Base, SearchQuery, Setting
from utils.logging_config import logger
from utils.vault import Vault

engine = create_engine(
    Config.SQLALCHEMY_DATABASE_URI,
    connect_args={"check_same_thread": False} if "sqlite" in Config.SQLALCHEMY_DATABASE_URI else {},
    echo=False
)

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))

@contextmanager
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()

def init_db():
    logger.info(f"Initializing database schema at {Config.DATABASE_PATH}...")
    Base.metadata.create_all(bind=engine)
    clean_and_migrate_secrets()
    seed_default_queries()
    seed_default_settings()

def clean_and_migrate_secrets():
    """
    Ensures zero plaintext secrets exist in SQLite.
    Migrates any legacy telegram tokens or api keys from settings table into the encrypted vault,
    then deletes them permanently from the settings table.
    """
    sensitive_keys = ["telegram_bot_token", "telegram_chat_id", "exa_api_key", "groq_api_key", "api_key", "smtp_password"]
    with get_db() as db:
        for sk in sensitive_keys:
            setting_row = db.query(Setting).filter_by(key=sk).first()
            if setting_row and setting_row.value:
                val = setting_row.value.strip()
                if val:
                    Vault.set_secret(sk, val)
                db.delete(setting_row)
                logger.info(f"Migrated sensitive key '{sk}' to encrypted vault and removed from database.")

def seed_default_queries():
    default_queries = [
        {"name": "Digital Marketing Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a digital marketing agency"', "source": "LinkedIn"},
        {"name": "Digital Marketing Agency - Need", "query": 'site:linkedin.com/posts "need a digital marketing agency"', "source": "LinkedIn"},
        {"name": "Digital Marketer - Looking For", "query": 'site:linkedin.com/posts "looking for a digital marketer"', "source": "LinkedIn"},
        {"name": "Digital Marketer - Need", "query": 'site:linkedin.com/posts "need a digital marketer"', "source": "LinkedIn"},
        {"name": "SEO Agency - Looking For", "query": 'site:linkedin.com/posts "looking for an SEO agency"', "source": "LinkedIn"},
        {"name": "SEO Services - Need", "query": 'site:linkedin.com/posts "need SEO services"', "source": "LinkedIn"},
        {"name": "Social Media Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a social media agency"', "source": "LinkedIn"},
        {"name": "Social Media Marketing - Need", "query": 'site:linkedin.com/posts "need social media marketing"', "source": "LinkedIn"},
        {"name": "Web Dev Agency - Looking For", "query": 'site:linkedin.com/posts "looking for a web development agency"', "source": "LinkedIn"},
        {"name": "Website - Need", "query": 'site:linkedin.com/posts "need a website"', "source": "LinkedIn"},
    ]

    with get_db() as db:
        existing_count = db.query(SearchQuery).count()
        if existing_count == 0:
            logger.info("Seeding initial default search template queries...")
            for dq in default_queries:
                db.add(SearchQuery(**dq, enabled=True))

def seed_default_settings():
    default_settings = {
        "company_name": Config.COMPANY_NAME,
        "company_tagline": Config.COMPANY_TAGLINE,
        "company_logo": Config.COMPANY_LOGO,
        "primary_color": Config.PRIMARY_COLOR,
        "search_interval_minutes": str(Config.SEARCH_INTERVAL_MINUTES),
        "telegram_enabled": str(Config.TELEGRAM_ENABLED).lower(),
        "email_enabled": "false",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": "587",
        "smtp_from_email": "",
        "smtp_to_email": "",
        "first_run_completed": "false",
    }

    with get_db() as db:
        for k, v in default_settings.items():
            setting = db.query(Setting).filter_by(key=k).first()
            if not setting:
                db.add(Setting(key=k, value=v))
