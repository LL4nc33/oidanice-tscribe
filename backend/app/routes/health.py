"""Health check endpoint.

WHY: A dedicated health route lets load balancers, Docker HEALTHCHECK,
and monitoring tools verify the service is alive without touching
business logic or the database.
"""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check() -> dict:
    """Return a simple liveness indicator.

    WHY: Returns a static response (no DB query) so the health check
    remains fast and never fails due to transient database issues.
    The 'service' field identifies this service in multi-service setups.
    """
    return {"status": "ok", "service": "tscribe"}
