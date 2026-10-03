#!/bin/bash
# =====================================================================
# Manual Setup Script — Run this ONCE after Terraform creates the EC2
# SSH into EC2 first: ssh -i your-key.pem ubuntu@<EC2_IP>
# Then run: bash setup-k8s.sh
# =====================================================================
set -e

DOCKERHUB_USER=$1   # Pass your Docker Hub username as argument

if [ -z "$DOCKERHUB_USER" ]; then
  echo "Usage: bash setup-k8s.sh YOUR_DOCKERHUB_USERNAME"
  exit 1
fi

echo "=== Waiting for K3s bootstrap to finish... ==="
sleep 10
sudo kubectl wait --for=condition=ready nodes --all --timeout=120s

echo "=== Applying Kubernetes manifests ==="
# Replace placeholder with actual Docker Hub username
sed -i "s/YOUR_DOCKERHUB/$DOCKERHUB_USER/g" ~/k8s/backend.yaml
sed -i "s/YOUR_DOCKERHUB/$DOCKERHUB_USER/g" ~/k8s/frontend.yaml

sudo kubectl apply -f ~/k8s/backend.yaml
sudo kubectl apply -f ~/k8s/frontend.yaml
sudo kubectl apply -f ~/k8s/ingress.yaml

echo "=== Waiting for pods to be ready ==="
sudo kubectl rollout status deployment helpdesk-backend --timeout=300s
sudo kubectl rollout status deployment helpdesk-frontend --timeout=300s

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
EC2_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)
echo "Your app is accessible at:"
echo "  Frontend:  http://$EC2_IP"
echo "  Backend:   http://$EC2_IP/api"
echo "  Grafana:   http://$EC2_IP:30300  (admin / admin123)"
echo "  Prometheus:http://$EC2_IP:9090"
echo ""
echo "To check pods status:"
echo "  sudo kubectl get pods"
echo "  sudo kubectl get services"
