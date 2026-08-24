"""
routers/health.py — Health-check endpoint.
"""

from fastapi import APIRouter

from schemas import HealthResponse

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthResponse, summary="Health check")
def health_check() -> HealthResponse:
    """Returns {"status": "ok"} so load-balancers / CI can verify the service is live."""
    return HealthResponse(status="ok")
