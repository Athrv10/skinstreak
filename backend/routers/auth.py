"""
routers/auth.py — Signup, Login, Logout & User profile endpoints.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from auth_utils import create_access_token, hash_password, verify_password
from database import get_db
from dependencies import get_current_user
from models import DailyRoutine, User
from schemas import AuthResponse, LoginRequest, ProfileStatsResponse, SignupRequest, UserRead
from streak_utils import get_user_streak_info

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post(
    "/signup",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user account",
)
def signup(payload: SignupRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Registers a new user with email, password and name.
    Returns access token and user details upon creation.
    """
    # 1. Check if email already exists
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    # 2. Validate password length
    if len(payload.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Password must be at least 6 characters long.",
        )

    # 3. Create user record
    hashed = hash_password(payload.password)
    new_user = User(
        email=payload.email.lower().strip(),
        name=payload.name.strip(),
        password_hash=hashed,
    )
    db.add(new_user)
    try:
        db.commit()
    except IntegrityError:
        # Another concurrent request registered this email first.
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )
    db.refresh(new_user)

    # 4. Generate JWT access token
    access_token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(new_user),
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="Authenticate user and return access token",
)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    """
    Authenticates user with email and password.
    Returns JWT access token if credentials are valid.
    """
    email_clean = payload.email.lower().strip()
    user = db.query(User).filter(User.email == email_clean).first()

    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": str(user.id), "email": user.email})

    return AuthResponse(
        access_token=access_token,
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.post("/logout", summary="Logout user")
def logout() -> dict[str, str]:
    """
    Stateless JWT logout confirmation endpoint.
    Client clears stored token from localStorage.
    """
    return {"message": "Successfully logged out"}


@router.get(
    "/me",
    response_model=UserRead,
    summary="Get current authenticated user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> UserRead:
    """Returns profile information for the currently logged-in user."""
    return UserRead.model_validate(current_user)


@router.get(
    "/profile-stats",
    response_model=ProfileStatsResponse,
    summary="Get profile statistics for the current user",
)
def get_profile_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ProfileStatsResponse:
    """
    Returns total routines completed (days where AM or PM is done),
    longest streak, current streak, and member since date.
    """
    # Count distinct dates where at least one of AM/PM was completed
    total_completed = (
        db.query(DailyRoutine)
        .filter(
            DailyRoutine.user_id == current_user.id,
            (DailyRoutine.am_done == True) | (DailyRoutine.pm_done == True),  # noqa: E712
        )
        .count()
    )

    streak_info = get_user_streak_info(current_user.id, db)

    return ProfileStatsResponse(
        total_routines_completed=total_completed,
        longest_streak=streak_info["longest_streak"],
        current_streak=streak_info["current_streak"],
        member_since=current_user.created_at,
    )
