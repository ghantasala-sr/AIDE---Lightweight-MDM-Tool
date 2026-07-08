# AIDE - Lightweight Master Data Management (MDM) Tool

AIDE is a highly aesthetic, scalable, and intelligent Master Data Management tool designed to simplify identity resolution and schema profiling. It leverages Google Vertex AI (Gemini 1.5 Pro) to automatically infer semantic types, identify primary match keys, and propose canonical mappings from uploaded datasets.

## Architecture

AIDE is built using a modern containerized microservices architecture:

1. **Frontend (`/frontend`)**: A React SPA built with Vite. Features a premium glassmorphic UI using Vanilla CSS and micro-animations. Served via Nginx in production.
2. **Orchestrator API (`/orchestrator-api`)**: A Spring Boot 3 (Java 17) backend that serves as a secure proxy and middle-tier API layer.
3. **Schema Profiler Service (`/schema-profiler-service`)**: A FastAPI (Python 3.12) service that interfaces directly with Google Cloud Vertex AI to run LLM-powered schema inference.

---

## Local Development Setup

To run this application locally, you must run all three services. 

### 1. Schema Profiler Service (Python)
You must be authenticated with Google Cloud (`gcloud auth application-default login`) and have a GCP project with the Vertex AI API enabled.
```bash
cd schema-profiler-service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Orchestrator API (Spring Boot)
Ensure you have Java 17 installed.
```bash
cd orchestrator-api
./mvnw spring-boot:run
```
*(Runs on `http://localhost:8080`)*

### 3. React Frontend
Ensure you have Node.js 20+ installed.
```bash
cd frontend
npm install
npm run dev
```
*(Runs on `http://localhost:5173`. API calls are automatically proxied to the Orchestrator via Vite config).*

---

## Automated Testing & CI/CD

This repository is equipped with a full continuous integration pipeline utilizing **GitHub Actions**. On every push or pull request to the `main` branch, the `.github/workflows/ci.yml` pipeline automatically runs the test suites:
- **Frontend**: Vitest and React Testing Library (`npm run test`)
- **Orchestrator**: JUnit 5 and Spring MockMvc (`./mvnw test`)
- **Profiler**: Pytest and FastAPI TestClient (`pytest`)

---

## Deployment to Google Cloud Run

AIDE is designed for serverless, autoscaling deployment on Google Cloud Run via Cloud Buildpacks.

### Prerequisites (IAM Permissions)
Your default Compute Engine service account must have the following roles on your GCP Project to successfully build and store containers:
- **Storage Admin** (`roles/storage.admin`)
- **Artifact Registry Writer** (`roles/artifactregistry.writer`)

You can grant these permissions via the terminal:
```bash
gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/storage.admin

gcloud projects add-iam-policy-binding YOUR_PROJECT_ID \
  --member=serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/artifactregistry.writer
```

### Deploying
Once permissions are set, simply run the automated deployment script from the project root. This script sequentially deploys the services and dynamically injects the generated Cloud Run URLs to link them together:
```bash
chmod +x deploy.sh
./deploy.sh
```

---
*Created as an enterprise-grade Forward Deployed Engineering initiative.*
