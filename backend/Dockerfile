FROM python:3.10-slim
WORKDIR /app
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt pandas
COPY backend/ ./
# Include the trained artifact in the image so classification still works
# when an optional Kubernetes hostPath/S3 model mount is missing.
COPY ml/ticket_classifier.joblib ./ml/ticket_classifier.joblib
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
