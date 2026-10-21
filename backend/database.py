import os
import re
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

logger = logging.getLogger("uvicorn")

DATABASE_URL = os.getenv("DATABASE_URL", "").strip()

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./helpdesk.db"
    print("=" * 70)
    print("⚠️  [DATABASE WARNING]: DATABASE_URL environment variable is NOT SET.")
    print("⚠️  Falling back to local SQLite: sqlite:///./helpdesk.db (EPHEMERAL).")
    print("⚠️  TICKETS WILL BE WIPED WHEN PODS RESTART OR REDEPLOY!")
    print("⚠️  To persist data in RDS, set DATABASE_URL in your Kubernetes secret.")
    print("=" * 70)
else:
    # Normalize postgres:// to postgresql:// for SQLAlchemy 1.4+ / 2.0+
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

    safe_db_url = re.sub(r':([^@]+)@', ':****@', DATABASE_URL)
    print("=" * 70)
    print(f"✅ [DATABASE CONNECTED]: Using Persistent Database: {safe_db_url}")
    print("=" * 70)

if "sqlite" in DATABASE_URL:
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )
else:
    # Production-ready PostgreSQL RDS settings with connection pooling & auto-reconnect
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Test connection before using; auto-reconnects if RDS dropped connection
        pool_recycle=300,    # Recycle connections every 5 minutes to avoid idle timeouts
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
