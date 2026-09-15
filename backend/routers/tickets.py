from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import get_db
from ml_service import ml_service

router = APIRouter(prefix="/tickets", tags=["tickets"])

@router.post("/", response_model=schemas.TicketResponse)
def create_ticket(ticket: schemas.TicketCreate, db: Session = Depends(get_db)):
    # Predict ML categorization
    ml_result = ml_service.predict_ticket(ticket.description)

    db_ticket = models.Ticket(
        title=ticket.title,
        description=ticket.description,
        predicted_category=ml_result["category"],
        department=ml_result["department"],
        priority=ml_result["priority"],
        confidence=ml_result["confidence"]
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/", response_model=List[schemas.TicketResponse])
def read_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).offset(skip).limit(limit).all()
    return tickets

@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket
