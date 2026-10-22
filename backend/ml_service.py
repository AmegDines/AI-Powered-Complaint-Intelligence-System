import os
import logging
from pathlib import Path

import joblib

logger = logging.getLogger(__name__)
BACKEND_DIR = Path(__file__).resolve().parent
# MODEL_PATH is used by Kubernetes when the artifact is mounted from EC2/S3.
# The bundled path keeps inference available when that mount is absent.
MODEL_PATHS = [
    Path(os.environ["MODEL_PATH"]) if os.environ.get("MODEL_PATH") else None,
    BACKEND_DIR / "ml" / "ticket_classifier.joblib",
]

department_routing = {
    "Network": "IT Support",
    "Hardware": "Technical Support",
    "Software": "IT Support",
    "Accounts": "Accounts",
    "Academic": "Academic Office",
    "Hostel": "Administration",
    "Transport": "Transport Dept",
    "Other": "General Admin"
}

class MLService:
    def __init__(self):
        self.model = None
        self.model_path = None
        for model_path in filter(None, MODEL_PATHS):
            if not model_path.is_file():
                logger.warning("ML model artifact not found at %s", model_path)
                continue
            try:
                self.model = joblib.load(model_path)
                self.model_path = str(model_path)
                logger.info("Loaded ML model from %s", model_path)
                break
            except Exception:
                logger.exception("Could not load ML model from %s", model_path)

        if self.model is None:
            logger.error("No usable ML model found; ticket classification is disabled")

    @property
    def is_ready(self):
        return self.model is not None

    def predict_ticket(self, text: str):
        if self.model is None:
            return {"category": "Unknown", "department": "Unassigned", "confidence": 0.0, "priority": "LOW"}

        predicted_cat = self.model.predict([text])[0]
        
        # Getting probability if possible, else 1.0
        try:
            proba = max(self.model.predict_proba([text])[0])
        except:
            proba = 1.0

        priority = "HIGH" if predicted_cat in ["Network", "Hardware"] else "MEDIUM"

        return {
            "category": predicted_cat,
            "department": department_routing.get(predicted_cat, "General Admin"),
            "confidence": round(float(proba), 2),
            "priority": priority
        }

ml_service = MLService()
