# OneNote AI Assistant

FastAPI + Next.js application that summarizes text, images (OCR), and audio (STT) and writes concise notes to OneNote via Microsoft Graph. Uses a local LLM through Ollama with safe CPU fallback.

## Features
- Chat-style interface (text, image, audio uploads)
- OCR (Tesseract) for images
- Speech‑to‑text (faster‑whisper) for audio
- Writes pages to OneNote (Microsoft Graph)
- MSAL Device Code authentication
- Runs locally or with Docker Compose

## Architecture
- Frontend: Next.js (TypeScript)
- Backend: FastAPI (Python), MSAL device flow
- LLM: Ollama HTTP API
- OCR/STT: Tesseract, faster‑whisper

Project layout (simplified):
```
.
├─ backend/
│  ├─ app/
│  │  ├─ main.py                # FastAPI app (+/health)
│  │  ├─ agent.py               # LLM prompts + routing
│  │  ├─ llm.py                 # Simple Ollama REST client
│  │  ├─ tools/
│  │  │  ├─ onenote.py          # Graph calls (list/write)
│  │  │  ├─ ocr.py              # Image OCR
│  │  │  └─ stt.py              # Audio transcription
│  │  └─ utils/msal_device.py   # Device code token
│  ├─ postman/                  # Collection + environment
│  ├─ Dockerfile
│  └─ .env                      # Backend config
├─ frontend/
│  ├─ Dockerfile
│  └─ (Next.js app)
└─ docker-compose.yml
```

## Prerequisites
- Windows 10/11 with Docker Desktop (WSL2)
- Node 20+ (for local frontend dev)
- Python 3.10+ (for local backend dev)
- Azure App Registration (Microsoft Graph)

## Azure App Registration (required)
1) Entra ID → App registrations → New registration
- Supported accounts: Any org directory and personal Microsoft accounts
2) Authentication → Advanced settings → Allow public client flows = Yes → Save
3) API permissions → Microsoft Graph → Delegated
- Add: Notes.ReadWrite (and optionally User.Read)
- Grant admin consent (required for org tenants)
4) Copy Application (client) ID → set in backend/.env as CLIENT_ID

## Backend configuration (backend/.env)
Example:
```
# LLM
OLLAMA_MODEL=mistral
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_FORCE_CPU=true
# OLLAMA_NUM_GPU_LAYERS=10
# OLLAMA_TEMPERATURE=0.2

# CORS
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Microsoft Graph
CLIENT_ID=<your-app-client-id>
TENANT_ID=common
GRAPH_SCOPES=User.Read Notes.ReadWrite

# OneNote defaults
DEFAULT_NOTEBOOK=Personal
DEFAULT_SECTION=Tasks

# OCR
TESSERACT_PATH=C:\\Program Files\\Tesseract-OCR\\tesseract.exe

# Optional
DEBUG=false
```
Notes:
- Reserved scopes (offline_access, openid, profile) are filtered automatically.
- TENANT_ID=common supports Microsoft & org; use consumers for personal‑only.

## Run locally
Backend:
```bat
cd "backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Frontend:
```bat
cd "frontend"
npm install
npm run dev
```
First Microsoft Graph login:
- Call GET /notebooks (Postman or browser). Backend prints a device login URL + code. Open the URL, enter the code, sign in, consent, then retry.

## API quick reference
- GET /health → { ok: true }
- GET /notebooks → list notebooks and sections
- POST /chat (multipart/form‑data)
  - text (string) | file (image/audio) | mode=text|image|audio | target_notebook | target_section

## Postman
Import:
- backend/postman/OneNoteAI.postman_collection.json
- backend/postman/OneNoteAI.postman_environment.json
Select environment “OneNote AI - Local” and run Health/Notebooks/Chat.

## Run with Docker Compose
From repo root:
```bat
docker compose build --no-cache
docker compose up
```
Services:
- Frontend → http://localhost:3000
- Backend  → http://localhost:8000
- Ollama   → http://localhost:11434

If Docker Desktop errors (named pipe/500), restart Docker Desktop and rebuild with:
```bat
set DOCKER_BUILDKIT=0
set COMPOSE_DOCKER_CLI_BUILD=0
docker compose build --no-cache
```

## Ollama setup (local)
Ollama serves the LLM used by the backend. You can run it locally or via Docker.

Windows (recommended local install):
1) Install Ollama: https://ollama.com/download
2) Start Ollama (it runs a background service on http://localhost:11434)
3) Pull a model (example: mistral):
```bat
ollama pull mistral
```
4) Optional: run Ollama manually (foreground) if the service is not active:
```bat
ollama serve
```

Backend configuration integrates with Ollama via `backend/.env`:
```
OLLAMA_MODEL=mistral
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_FORCE_CPU=true
# OLLAMA_NUM_GPU_LAYERS=10     # cap GPU layers if using a small GPU
# OLLAMA_TEMPERATURE=0.2       # optional sampling tweak
```

Notes:
- If you hit CUDA/CUDA_Host memory errors, keep `OLLAMA_FORCE_CPU=true` or set a small `OLLAMA_NUM_GPU_LAYERS`. Consider using a smaller/quantized model (e.g., mistral:7b, llama3.1:8b-instruct-q4).
- When using Docker Compose, the `ollama` service exposes port 11434 and the backend connects to it by hostname `ollama` inside the compose network; for local (non-Docker) runs, use `http://localhost:11434`.
- Ensure the model name in `OLLAMA_MODEL` matches a pulled model (`ollama list`).

## Troubleshooting
- 401 Unauthorized (Graph)
  - Ensure Notes.ReadWrite permission and admin consent (org tenants)
  - Complete device code login from backend logs
- Reserved scope error
  - Don’t include offline_access/openid/profile in GRAPH_SCOPES; backend filters them
- Ollama CUDA_Host/CUDA buffer error
  - OLLAMA_FORCE_CPU=true or set a small OLLAMA_NUM_GPU_LAYERS; use smaller/quantized models
- /health 404
  - Ensure backend is running on http://localhost:8000/health

## Notes
- Backend uses a lightweight Ollama REST client and balanced‑brace JSON extraction for robust parsing.
- Tesseract is required for OCR; Docker backend image includes it.
