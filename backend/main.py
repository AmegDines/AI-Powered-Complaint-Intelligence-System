from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import models
from database import engine
from routers import tickets

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Helpdesk Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(tickets.router)
app.include_router(tickets.router, prefix="/api")

@app.get("/")
def root():
    return {"message": "API is running"}

@app.get("/health")
def health():
    is_sqlite = "sqlite" in str(engine.url)
    return {
        "status": "healthy",
        "database": "sqlite (ephemeral - data will be lost on pod restart)" if is_sqlite else "postgresql (persistent RDS)",
        "persistent_storage": not is_sqlite
    }
