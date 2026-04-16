"""
Minimal backend for iWhistle — serves health check on port 8001.
The actual application is a React SPA that communicates directly with Firebase.
This backend exists solely for Emergent platform deployment health checks.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="iWhistle API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "iwhistle", "backend": "minimal"}
