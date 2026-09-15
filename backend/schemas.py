from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TicketCreate(BaseModel):
    title: str
    description: str

class TicketResponse(BaseModel):
    id: int
    title: str
    description: str
    predicted_category: Optional[str]
    department: Optional[str]
    priority: Optional[str]
    confidence: Optional[float]
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
