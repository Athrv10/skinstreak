"""
photo_storage.py — Abstraction over where progress photos are persisted.

Uses Supabase Storage (survives redeploys — the requirement for hosting
the backend on Render/Railway, whose local disks are wiped on every
redeploy) when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured.
Falls back to local disk under backend/uploads/ otherwise, so local
development keeps working without requiring Supabase Storage credentials.
"""

import os
from pathlib import Path

import httpx
from dotenv import load_dotenv

_env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=_env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "progress-photos")

USE_SUPABASE_STORAGE = bool(SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY)

# Local fallback directory — also what main.py mounts at /uploads for
# StaticFiles, so local-disk photos keep working when Supabase isn't configured.
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def save_photo(filename: str, content_type: str, contents: bytes) -> str:
    """
    Persists photo bytes to storage and returns a storage_url.

    The returned value may be a full https:// URL (Supabase Storage) or a
    relative /uploads/... path (local disk) — the frontend's
    getPhotoFullUrl() already handles both.
    """
    if USE_SUPABASE_STORAGE:
        response = httpx.post(
            f"{SUPABASE_URL}/storage/v1/object/{SUPABASE_STORAGE_BUCKET}/{filename}",
            headers={
                "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
                "apikey": SUPABASE_SERVICE_ROLE_KEY,
                "Content-Type": content_type,
                "x-upsert": "true",
            },
            content=contents,
            timeout=30.0,
        )
        response.raise_for_status()
        return f"{SUPABASE_URL}/storage/v1/object/public/{SUPABASE_STORAGE_BUCKET}/{filename}"

    destination_path = UPLOADS_DIR / filename
    with open(destination_path, "wb") as f:
        f.write(contents)
    return f"/uploads/{filename}"
