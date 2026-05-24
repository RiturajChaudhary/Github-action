# Three-Tier Todo App — Node.js + MongoDB + Nginx

A full three-tier web application deployed via GitHub Actions (self-hosted runner) to Kubernetes, with Docker images pushed to Docker Hub.

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  KUBERNETES CLUSTER              │
│                                                  │
│  ┌──────────────┐    ┌──────────────┐           │
│  │   TIER 1     │    │   TIER 2     │           │
│  │  Frontend    │───▶│   Backend    │           │
│  │  Nginx:80    │    │  Express:5000│           │
│  │  (2 replicas)│    │  (2 replicas)│           │
│  └──────────────┘    └──────┬───────┘           │
│                             │                    │
│                      ┌──────▼───────┐            │
│                      │   TIER 3     │            │
│                      │   MongoDB    │            │
│                      │   :27017     │            │
│                      └──────────────┘            │
└─────────────────────────────────────────────────┘
```

## Project Structure

```
├── frontend/
│   ├── index.html        # Single-page Todo UI
│   ├── nginx.conf        # Nginx reverse proxy config
│   └── Dockerfile
├── backend/
│   ├── index.js          # Express REST API
│   ├── package.json
│   └── Dockerfile
├── k8s/
│   └── fullstack-deployment.yaml   # All K8s manifests
├── .github/
│   └── workflows/
│       └── ci-cd.yml     # GitHub Actions pipeline
└── docker-compose.yml    # Local development
```

## Local Development

```bash
docker compose up --build
# App at http://localhost
# API at http://localhost/api/todos
```

## GitHub Secrets Required

| Secret | Description |
|---|---|
| `DOCKER_USERNAME` | Docker Hub username (`rituraj4164`) |
| `DOCKER_PASSWORD` | Docker Hub password or access token |
| `K8S_REPO_TOKEN` | GitHub PAT with write access to argocd repo |

Set them at: **Repo → Settings → Secrets → Actions**

## CI/CD Pipeline Flow

```
Push to main
     │
     ▼
Self-hosted EC2 runner picks up job
     │
     ▼
docker compose build  (builds frontend + backend)
     │
     ▼
Tag images with short SHA (e.g. rituraj4164/backend:a1b2c3d)
     │
     ▼
Push to Docker Hub (SHA tag + latest)
     │
     ▼
Clone argocd-github-action repo
     │
     ▼
sed patch fullstack-deployment.yaml with new SHA tags
     │
     ▼
Commit + push → ArgoCD detects change → deploys to K8s
```

## Self-Hosted Runner Setup

```bash
# On your EC2 instance
mkdir actions-runner && cd actions-runner
curl -o actions-runner.tar.gz -L https://github.com/actions/runner/releases/download/v2.317.0/actions-runner-linux-x64-2.317.0.tar.gz
tar xzf actions-runner.tar.gz
./config.sh --url https://github.com/RiturajChaudhary/Github-action --token YOUR_TOKEN
sudo ./svc.sh install
sudo ./svc.sh start
```

## Deploy to Kubernetes

```bash
kubectl apply -f k8s/fullstack-deployment.yaml
kubectl get pods
kubectl get svc frontend-service   # get external IP
```

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/todos` | Get all todos |
| POST | `/api/todos` | Create todo `{ text }` |
| PATCH | `/api/todos/:id` | Toggle done |
| DELETE | `/api/todos/:id` | Delete todo |
