#!/bin/bash
set -e

# AIDE Project GCP Deployment Script
# This script deploys the 3 services to Google Cloud Run using Cloud Buildpacks.

PROJECT_ID="aide-project-1783548924"
REGION="us-central1"

echo "======================================"
echo "Deploying AIDE to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "======================================"

# 1. Deploy Frontend
echo "--> Deploying React Frontend..."
cd frontend
gcloud run deploy aide-frontend \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet
cd ..

# 2. Deploy Orchestrator API
echo "--> Deploying Spring Boot Orchestrator..."
cd orchestrator-api
gcloud run deploy aide-orchestrator-api \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet
cd ..

# 3. Deploy Python Schema Profiler
echo "--> Deploying Python Schema Profiler..."
cd schema-profiler-service
gcloud run deploy aide-schema-profiler \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet
cd ..

echo "======================================"
echo "Deployment Complete!"
echo "======================================"
