(# Backend (FastAPI) – OneNote AI Assistant

Backend for the OneNote AI Assistant. See the root `README.md` for full setup (frontend, Docker, Azure).

## Quickstart (local)
```bat
cd "backend"
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Health check:
- http://localhost:8000/health → `{ "ok": true }`

## Environment (`backend/.env`)
- CLIENT_ID, TENANT_ID, GRAPH_SCOPES (e.g., `User.Read Notes.ReadWrite`)
- OLLAMA_MODEL, OLLAMA_BASE_URL, OLLAMA_FORCE_CPU=true
- DEFAULT_NOTEBOOK, DEFAULT_SECTION
- TESSERACT_PATH (Windows), or use Docker where it’s preinstalled

## Endpoints
- GET `/health`
- GET `/notebooks`
- POST `/chat` (form-data: `text` | `file` | `mode` | `target_notebook` | `target_section`)

## Microsoft Graph
- MSAL Device Code flow. Trigger by calling `/notebooks` and follow the console instructions.
- Don’t include reserved scopes (`offline_access`, `openid`, `profile`) in `GRAPH_SCOPES`.

## Docker
Use `docker-compose.yml` at repo root to run backend + frontend + ollama together.
