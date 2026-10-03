#!/bin/bash
# =============================================================
# EC2 Bootstrap Script — runs once when instance first starts
# This sets up the K3s Kubernetes cluster on t2.micro
# =============================================================
set -e

LOG="/var/log/bootstrap.log"
exec >> $LOG 2>&1
echo "[$(date)] Starting bootstrap..."

# =============================================================
# STEP 1: Swap Space
# t2.micro has only 1GB RAM. The ML model + FastAPI + Postgres
# client + K3s can exceed that. Swap prevents OOM crashes.
# =============================================================
if [ ! -f /swapfile ]; then
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
  echo "[$(date)] Swap created"
fi

# =============================================================
# STEP 2: System updates + AWS CLI
# =============================================================
apt-get update -y
apt-get install -y curl wget unzip awscli git

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip && ./aws/install && rm -rf awscliv2.zip aws/

echo "[$(date)] System tools installed"

# =============================================================
# STEP 3: Install K3s (Lightweight Kubernetes)
# Why K3s and not full K8s?
#  - K8s control plane alone needs 2GB+ RAM
#  - K3s runs in ~300MB RAM — fits our t2.micro
#  - K3s is 100% Kubernetes API compatible
#  - It comes with built-in LoadBalancer (Traefik) for routing
# =============================================================
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="server --disable=traefik" sh -
# Disable Traefik — we use nginx ingress which is lighter

# Wait for k3s to fully start
sleep 30
echo "[$(date)] K3s installed"

# Make kubectl available system-wide
mkdir -p ~/.kube
cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
chmod 600 ~/.kube/config
export KUBECONFIG=/etc/rancher/k3s/k3s.yaml

# Grant ubuntu user access to kubectl
mkdir -p /home/ubuntu/.kube
cp /etc/rancher/k3s/k3s.yaml /home/ubuntu/.kube/config
chown ubuntu:ubuntu /home/ubuntu/.kube/config
echo 'export KUBECONFIG=/home/ubuntu/.kube/config' >> /home/ubuntu/.bashrc

# =============================================================
# STEP 4: Install Helm (K8s package manager)
# Used to install Prometheus + Grafana easily
# =============================================================
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
echo "[$(date)] Helm installed"

# =============================================================
# STEP 5: Download ML Model from S3
# The ML model was trained locally and uploaded to S3.
# The backend container mounts it from /opt/ml/
# =============================================================
mkdir -p /opt/ml
aws s3 cp s3://${s3_bucket_name}/ticket_classifier.joblib /opt/ml/ticket_classifier.joblib || echo "Model not yet in S3 — backend will run without ML"
echo "[$(date)] ML model fetched from S3"

# =============================================================
# STEP 6: Create Kubernetes Secrets for DB + Environment vars
# =============================================================
kubectl create secret generic app-secrets \
  --from-literal=database_url="${db_url}" \
  --from-literal=s3_bucket="${s3_bucket_name}" \
  --namespace=default \
  --dry-run=client -o yaml | kubectl apply -f -

echo "[$(date)] K8s secrets created"

# =============================================================
# STEP 7: Install Nginx Ingress Controller
# Routes traffic from port 80 to frontend/backend services
# =============================================================
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.resources.requests.memory="64Mi" \
  --set controller.resources.requests.cpu="50m"

echo "[$(date)] Nginx Ingress installed"

# =============================================================
# STEP 8: Install Prometheus + Grafana (Monitoring)
# Uses kube-prometheus-stack but with minimal resource limits
# to fit within our 1GB RAM + 2GB swap budget
# =============================================================
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

helm install monitoring prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --set grafana.enabled=true \
  --set grafana.service.type=NodePort \
  --set grafana.service.nodePort=30300 \
  --set grafana.adminPassword=admin123 \
  --set prometheus.prometheusSpec.resources.requests.memory="100Mi" \
  --set prometheus.prometheusSpec.resources.limits.memory="300Mi" \
  --set alertmanager.enabled=false \
  --set kubeStateMetrics.enabled=true \
  --set nodeExporter.enabled=true

echo "[$(date)] Prometheus + Grafana installed"

echo "[$(date)] Bootstrap COMPLETE. EC2 is ready."
