from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TicketCreate(BaseModel):
    title: str
    description: str

class TicketStatusUpdate(BaseModel):
    status: str

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    predicted_category: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = None
    confidence: Optional[float] = None
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True
