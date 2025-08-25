import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Load environment variables early so downstream imports (LLM, etc.) see flags
load_dotenv()

from app.routers.agent_routes import router as agent_router

app = FastAPI(title="OneNote Agent (Ollama + OCR + STT)")

origins = [o.strip() for o in (os.getenv("CORS_ORIGINS") or "").split(",") if o.strip()]
if not origins:
    origins = ["http://localhost:3000", "http://127.0.0.1:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agent_router, tags=["agent"])

@app.get("/")
def root():
    return {"status": "ok", "msg": "Backend running"}

@app.get("/health")
def health():
    return {"ok": True}
