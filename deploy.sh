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

# 1. Deploy Python Schema Profiler
echo "--> Deploying Python Schema Profiler..."
cd schema-profiler-service
gcloud run deploy aide-schema-profiler \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --allow-unauthenticated \
  --quiet
PROFILER_URL=$(gcloud run services describe aide-schema-profiler --project $PROJECT_ID --region $REGION --format 'value(status.url)')
echo "Python Profiler deployed at: $PROFILER_URL"
cd ..

# 2. Deploy Orchestrator API
echo "--> Deploying Spring Boot Orchestrator..."
cd orchestrator-api
gcloud run deploy aide-orchestrator-api \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --update-env-vars PYTHON_SERVICE_URL="${PROFILER_URL}/profile-schema" \
  --allow-unauthenticated \
  --quiet
ORCHESTRATOR_URL=$(gcloud run services describe aide-orchestrator-api --project $PROJECT_ID --region $REGION --format 'value(status.url)')
echo "Orchestrator API deployed at: $ORCHESTRATOR_URL"
cd ..

# 3. Deploy Frontend
echo "--> Deploying React Frontend..."
cd frontend
gcloud run deploy aide-frontend \
  --source . \
  --project $PROJECT_ID \
  --region $REGION \
  --update-env-vars ORCHESTRATOR_URL="$ORCHESTRATOR_URL" \
  --allow-unauthenticated \
  --quiet
FRONTEND_URL=$(gcloud run services describe aide-frontend --project $PROJECT_ID --region $REGION --format 'value(status.url)')
echo "React Frontend deployed at: $FRONTEND_URL"
cd ..

echo "======================================"
echo "Deployment Complete!"
echo "Visit your app at: $FRONTEND_URL"
echo "======================================"
