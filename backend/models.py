from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
from database import Base

class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    predicted_category = Column(String)
    department = Column(String)
    priority = Column(String)
    confidence = Column(Float)
    status = Column(String, default="OPEN")
    created_at = Column(DateTime, default=datetime.utcnow)
