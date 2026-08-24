"""
main.py — FastAPI application entry-point.

Start with:
    uvicorn main:app --reload --port 8000
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import auth, health, photos, reminders, routine, streak
from scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="SkinStreak API",
    description="Backend for the SkinStreak skincare habit-tracking app.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Static file serving for uploaded photos
uploads_path = Path(__file__).resolve().parent / "uploads"
uploads_path.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_path)), name="uploads")

# ─── CORS ────────────────────────────────────────────────────────────────────────
# Read allowed origins from env — set ALLOWED_ORIGINS as comma-separated URLs.
# Falls back to localhost Vite dev server for local development.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ─────────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(routine.router)
app.include_router(streak.router)
app.include_router(photos.router)
app.include_router(reminders.router)



@app.get("/", include_in_schema=False)
def root():
    return {"message": "SkinStreak API — visit /docs for interactive documentation."}

