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
        confidence=ml_result["confidence"],
        status="Not Resolved"
    )
    db.add(db_ticket)
    db.commit()
    db.refresh(db_ticket)
    return db_ticket

@router.get("/", response_model=List[schemas.TicketResponse])
def read_tickets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tickets = db.query(models.Ticket).order_by(models.Ticket.id.desc()).offset(skip).limit(limit).all()
    for t in tickets:
        if not t.status or t.status.upper() == "OPEN":
            t.status = "Not Resolved"
    return tickets

@router.get("/{ticket_id}", response_model=schemas.TicketResponse)
def read_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")
    if not ticket.status or ticket.status.upper() == "OPEN":
        ticket.status = "Not Resolved"
    return ticket

@router.patch("/{ticket_id}/status", response_model=schemas.TicketResponse)
@router.put("/{ticket_id}/status", response_model=schemas.TicketResponse)
def update_ticket_status(ticket_id: int, status_update: schemas.TicketStatusUpdate, db: Session = Depends(get_db)):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if ticket is None:
        raise HTTPException(status_code=404, detail="Ticket not found")

    new_status = status_update.status.strip()
    if new_status.lower() == "resolved":
        ticket.status = "Resolved"
    elif new_status.lower() in ["not resolved", "open", "unresolved"]:
        ticket.status = "Not Resolved"
    else:
        ticket.status = new_status

    db.commit()
    db.refresh(ticket)
    return ticket

@router.patch("/{ticket_id}", response_model=schemas.TicketResponse)
@router.put("/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(ticket_id: int, status_update: schemas.TicketStatusUpdate, db: Session = Depends(get_db)):
    return update_ticket_status(ticket_id, status_update, db)
