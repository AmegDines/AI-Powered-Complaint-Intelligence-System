import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "ml", "ticket_classifier.joblib")

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
        try:
            if os.path.exists(MODEL_PATH):
                self.model = joblib.load(MODEL_PATH)
        except Exception as e:
            print(f"Could not load model: {e}")

    def predict_ticket(self, text: str):
        if not self.model:
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
