"""
routers/photos.py — Progress photo upload and gallery endpoints.
"""

import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session, joinedload

from database import get_db
from dependencies import get_current_user
from models import Photo, User
from photo_storage import save_photo
from schemas import PhotoRead
from streak_utils import get_or_create_today_routine

router = APIRouter(prefix="/photos", tags=["photos"])

# Allowed MIME types and their corresponding extensions
ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/jpg":  ".jpg",
    "image/png":  ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post(
    "/upload",
    response_model=PhotoRead,
    status_code=status.HTTP_201_CREATED,
    summary="Upload progress photo for today's check-in",
)
async def upload_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PhotoRead:
    """
    Accepts an uploaded progress photo (JPEG/PNG/WebP only, max 10 MB).
    Saves file to storage, links to today's daily routine, and returns photo details.
    """
    # 1. Validate MIME type against strict allowlist
    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=(
                f"Unsupported file type '{content_type}'. "
                "Only JPEG, PNG, and WebP images are accepted."
            ),
        )

    # 2. Read file bounded to one byte past the limit — enforces the size
    #    cap without buffering an arbitrarily large upload into memory first.
    contents = await file.read(MAX_FILE_SIZE_BYTES + 1)
    if len(contents) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File is too large. Maximum allowed size is 10 MB.",
        )

    # 3. Generate unique filename using validated extension
    file_ext = ALLOWED_CONTENT_TYPES[content_type]
    unique_filename = f"user_{current_user.id}_{uuid.uuid4().hex[:10]}{file_ext}"

    # 4. Persist the file (Supabase Storage if configured, else local disk)
    storage_url = save_photo(unique_filename, content_type, contents)

    # 5. Get or create today's daily routine
    routine = get_or_create_today_routine(current_user.id, db)

    # 6. Save photo record in database
    new_photo = Photo(
        user_id=current_user.id,
        daily_routine_id=routine.id,
        storage_url=storage_url,
        captured_at=datetime.now(timezone.utc),
    )
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)

    return PhotoRead(
        id=new_photo.id,
        user_id=new_photo.user_id,
        daily_routine_id=new_photo.daily_routine_id,
        storage_url=new_photo.storage_url,
        captured_at=new_photo.captured_at,
        created_at=new_photo.created_at,
        streak_day=routine.streak_count,
        am_done=routine.am_done,
        pm_done=routine.pm_done,
    )


@router.get(
    "",
    response_model=List[PhotoRead],
    summary="Get all progress photos for authenticated user",
)
def get_photos(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> List[PhotoRead]:
    """Returns all progress photos uploaded by the user sorted by captured_at descending."""
    photos = (
        db.query(Photo)
        .options(joinedload(Photo.daily_routine))
        .filter(Photo.user_id == current_user.id)
        .order_by(Photo.captured_at.desc())
        .all()
    )

    result: List[PhotoRead] = []
    for p in photos:
        routine = p.daily_routine
        result.append(
            PhotoRead(
                id=p.id,
                user_id=p.user_id,
                daily_routine_id=p.daily_routine_id,
                storage_url=p.storage_url,
                captured_at=p.captured_at,
                created_at=p.created_at,
                streak_day=routine.streak_count if routine else 0,
                am_done=routine.am_done if routine else False,
                pm_done=routine.pm_done if routine else False,
            )
        )

    return result


@router.get(
    "/{photo_id}",
    response_model=PhotoRead,
    summary="Get details of a single progress photo",
)
def get_photo_by_id(
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> PhotoRead:
    """Returns details for a specific photo ID if owned by the current user."""
    photo = (
        db.query(Photo)
        .options(joinedload(Photo.daily_routine))
        .filter(Photo.id == photo_id, Photo.user_id == current_user.id)
        .first()
    )

    if not photo:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Photo not found.",
        )

    routine = photo.daily_routine
    return PhotoRead(
        id=photo.id,
        user_id=photo.user_id,
        daily_routine_id=photo.daily_routine_id,
        storage_url=photo.storage_url,
        captured_at=photo.captured_at,
        created_at=photo.created_at,
        streak_day=routine.streak_count if routine else 0,
        am_done=routine.am_done if routine else False,
        pm_done=routine.pm_done if routine else False,
    )
