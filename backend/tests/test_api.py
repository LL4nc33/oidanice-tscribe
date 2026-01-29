"""API endpoint tests for OidaNice TScribe.

Uses httpx AsyncClient with an in-memory SQLite database.
Redis and RQ are fully mocked -- no external services needed.
"""

import pytest


# ---- Health endpoint -----------------------------------------------------


@pytest.mark.anyio
async def test_health_returns_200(client):
    response = await client.get("/api/health")
    assert response.status_code == 200


@pytest.mark.anyio
async def test_health_response_body(client):
    response = await client.get("/api/health")
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "tscribe"


# ---- POST /api/jobs (create job) -----------------------------------------


@pytest.mark.anyio
async def test_create_job_valid_url(client):
    response = await client.post(
        "/api/jobs/",
        json={"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"},
    )
    assert response.status_code == 201
    data = response.json()
    assert "id" in data
    assert data["url"] == "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    assert data["status"] == "queued"


@pytest.mark.anyio
async def test_create_job_with_language(client):
    response = await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video.mp4", "language": "de"},
    )
    assert response.status_code == 201
    assert response.json()["language"] == "de"


@pytest.mark.anyio
async def test_create_job_invalid_url(client):
    response = await client.post("/api/jobs/", json={"url": "not-a-url"})
    assert response.status_code == 422  # Pydantic validation error


@pytest.mark.anyio
async def test_create_job_missing_url(client):
    response = await client.post("/api/jobs/", json={})
    assert response.status_code == 422


# ---- GET /api/jobs (list jobs) -------------------------------------------


@pytest.mark.anyio
async def test_list_jobs_empty(client):
    response = await client.get("/api/jobs/")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.anyio
async def test_list_jobs_after_create(client):
    await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video1.mp4"},
    )
    await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video2.mp4"},
    )

    response = await client.get("/api/jobs/")
    assert response.status_code == 200
    jobs = response.json()
    assert len(jobs) == 2


@pytest.mark.anyio
async def test_list_jobs_excludes_result_text(client):
    """JobListResponse should not include result_text field."""
    await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video.mp4"},
    )
    response = await client.get("/api/jobs/")
    jobs = response.json()
    assert "result_text" not in jobs[0]


# ---- GET /api/jobs/{id} (get single job) ---------------------------------


@pytest.mark.anyio
async def test_get_job_exists(client):
    create_resp = await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video.mp4"},
    )
    job_id = create_resp.json()["id"]

    response = await client.get(f"/api/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json()["id"] == job_id


@pytest.mark.anyio
async def test_get_job_not_found(client):
    response = await client.get("/api/jobs/nonexistent-id-12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


# ---- DELETE /api/jobs/{id} -----------------------------------------------


@pytest.mark.anyio
async def test_delete_job_exists(client):
    create_resp = await client.post(
        "/api/jobs/",
        json={"url": "https://example.com/video.mp4"},
    )
    job_id = create_resp.json()["id"]

    response = await client.delete(f"/api/jobs/{job_id}")
    assert response.status_code == 204

    # Verify it is gone
    get_resp = await client.get(f"/api/jobs/{job_id}")
    assert get_resp.status_code == 404


@pytest.mark.anyio
async def test_delete_job_not_found(client):
    response = await client.delete("/api/jobs/nonexistent-id-12345")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()
