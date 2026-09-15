import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.naive_bayes import MultinomialNB
from sklearn.linear_model import LogisticRegression
from sklearn.svm import LinearSVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score
import joblib

print("Loading data...")
df = pd.read_csv("tickets.csv")
X = df["text"]
y = df["category"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

models = {
    "Naive Bayes": MultinomialNB(),
    "Logistic Regression": LogisticRegression(max_iter=1000),
    "Linear SVM": LinearSVC(dual=False),
    "Random Forest": RandomForestClassifier(n_estimators=100)
}

best_model = None
best_f1 = 0.0
best_name = ""

print("Training models...")
for name, clf in models.items():
    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(stop_words="english")),
        ("clf", clf)
    ])
    pipeline.fit(X_train, y_train)
    y_pred = pipeline.predict(X_test)
    
    acc = accuracy_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred, average="weighted")
    print(f"{name} -> Accuracy: {acc:.4f}, F1-Score: {f1:.4f}")
    
    if f1 > best_f1:
        best_f1 = f1
        best_model = pipeline
        best_name = name

print(f"\nBest Model: {best_name} with F1-Score: {best_f1:.4f}")
joblib.dump(best_model, "ticket_classifier.joblib")
print("Saved best model to ticket_classifier.joblib")
