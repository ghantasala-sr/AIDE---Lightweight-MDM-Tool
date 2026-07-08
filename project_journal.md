# AIDE Project Journal
*Forward Deployed Engineering (FDE) Log*

## Overview
**Project Name:** AIDE (Lightweight Master Data Management Tool)  
**Objective:** Build a scalable, highly aesthetic MDM tool with a microservices architecture, leveraging Google Vertex AI (Gemini 1.5 Pro) for automated schema profiling and identity resolution mapping.  
**Architecture:** Monorepo containing React (Frontend), Spring Boot (Orchestrator), and FastAPI (AI Profiler).

---

## Log Entries

### Phase 1: Project Initialization & Scaffolding
**Goal:** Establish the baseline microservices architecture and monorepo structure.
- **Frontend:** Initialized a React SPA using Vite. Applied a premium, modern "glassmorphism" design system using Vanilla CSS, avoiding heavy framework dependencies per user preference.
- **Orchestrator:** Scaffolded a Spring Boot 3 application (Java 17) to serve as the secure middle-tier API and proxy.
- **AI Profiler:** Initialized a Python FastAPI service dedicated to data processing and LLM interaction.

### Phase 2: Core Implementation & Vertex AI Integration
**Goal:** Implement the primary user flows and connect to Google Cloud AI services.
- **UI Development:** Built out the `UploadScreen`, `MappingReview`, and `Dashboard` components with micro-animations and responsive layouts.
- **Vertex AI Integration:** Integrated `langchain-google-vertexai` in the Python service. Configured prompt engineering to instruct `gemini-1.5-pro-preview-0409` to analyze table columns and return strongly-typed JSON representing semantic inferences.
- **Technical Hurdles Resolved:** 
  - Overcame ARM64 compilation issues with `pydantic-core` by strictly standardizing the virtual environment to Python 3.12.
  - Resolved Spring Boot initialization failures by aligning `DemoApplication` class names to `AideOrchestratorApplication`.

### Phase 3: Automated Testing & CI/CD Pipeline
**Goal:** Enforce enterprise quality standards through automated testing and continuous integration.
- **Testing Suites:** 
  - Implemented `Vitest` for React component testing.
  - Implemented `JUnit` with `MockMvc` for Spring Boot controller health checks.
  - Implemented `pytest` with FastAPI `TestClient` for Python endpoint validation.
- **CI/CD Configuration:** Authored `.github/workflows/ci.yml` to trigger parallel testing jobs on Ubuntu runners for every push to the `main` branch.
- **Repository Hygiene:** Restructured `.gitignore` to prevent massive local dependencies (`node_modules`, `venv312`) from bloating the repository, actively removing accidentally tracked caches.

### Phase 4: Containerization & GCP Deployment Readiness
**Goal:** Prepare the microservices for cloud-native deployment on Google Cloud Run.
- **Dockerization:**
  - Wrote a multi-stage Dockerfile for the React frontend, utilizing `nginx:alpine` to serve static assets.
  - Wrote a multi-stage Dockerfile for Spring Boot utilizing Eclipse Temurin.
  - Wrote a lightweight Dockerfile for the Python service.
- **Deployment Scripting:** Created `deploy.sh` leveraging Google Cloud Buildpacks and `gcloud run deploy` to automate the containerization and rollout of all three services sequentially.
- **Technical Hurdles Resolved:** 
  - Adjusted the Vertex AI initialization in the Python service. By deferring the `VertexAI()` client instantiation until the actual endpoint is invoked (rather than at module load), we prevented the CI/CD pipeline from crashing due to missing GCP credentials during Pytest collection.

### Phase 5: Dynamic Service Routing (In Progress)
**Goal:** Connect the deployed services in GCP.
- **Current Challenge:** When deployed to Cloud Run, services receive dynamic, unpredictable URLs (e.g., `https://aide-frontend-xxx.a.run.app`), breaking hardcoded `localhost` links.
- **Action Plan:**
  - Update the React frontend to use relative paths (`/api/...`).
  - Configure Nginx with an `nginx.conf.template` to use `envsubst`, injecting the Orchestrator's dynamic URL into the reverse proxy at runtime.
  - Update the Spring Boot Orchestrator to accept the Python service URL via a `@Value` environment variable property (`PYTHON_SERVICE_URL`).

---
*End of Journal.*
