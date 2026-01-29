# Security

## Security Model

TScribe is designed for **self-hosted deployment on trusted networks**. It has no user authentication -- anyone with network access can submit URLs for transcription, view results, and delete jobs.

If you need to expose TScribe to the public internet, place it behind a zero-trust proxy such as Cloudflare Access, Authelia, or Tailscale Funnel.

## Implemented Protections

| Protection | Description | Location |
|---|---|---|
| Non-root containers | API and worker run as UID 1000 (`tscribe` user) via gosu entrypoint. Containers never execute application code as root. | `backend/Dockerfile`, `backend/entrypoint.sh` |
| SSRF protection | Submitted URLs are DNS-resolved and checked against private, reserved, loopback, and link-local IP ranges before the job is enqueued. | `backend/app/routes/jobs.py` (`_validate_url_not_private`) |
| Redis authentication | Redis requires a password (`--requirepass`), preventing unauthorized cross-container access to the job queue. | `docker-compose.yml` |
| UUID path validation | Job IDs are typed as `uuid.UUID` in path parameters. FastAPI returns 422 for any malformed ID, preventing path traversal or injection via job endpoints. | `backend/app/routes/jobs.py` |
| Security headers | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin` set on all frontend responses. | `frontend/nginx.conf` |
| CORS restriction | Only `GET`, `POST`, `DELETE` methods and `Content-Type` header are allowed. Origins configurable via `TSCRIBE_CORS_ORIGINS`. | `backend/app/main.py` |
| Proxy headers | Uvicorn runs with `--proxy-headers` and `--forwarded-allow-ips *` so `X-Forwarded-For` is logged correctly behind nginx. | `backend/Dockerfile` (CMD) |
| File cleanup | Three layers: immediate cleanup after transcription, 24-hour periodic sweep (`cleanup_max_age_hours`), and manual delete via API. | `backend/app/config.py`, job routes |
| Orphaned job recovery | Jobs stuck in PROCESSING when the worker restarts are marked FAILED, preventing silent data loss. | Worker startup logic |
| Input validation | URL payloads validated as `HttpUrl` via Pydantic before any processing occurs. | `backend/app/schemas.py` |

## Known Limitations

- **No authentication or authorization.** By design for trusted-network use. Any client with network access has full control.
- **No rate limiting.** A single client can flood the queue. Add [slowapi](https://github.com/laurentS/slowapi) if exposing publicly.
- **SQLite database is unencrypted on disk.** Job metadata and transcript text are stored in plaintext at `/data/tscribe.db`.
- **Default Redis password is hardcoded.** The default `tscribe-redis-secret` is visible in `docker-compose.yml`. Override via `REDIS_PASSWORD` in `.env` for sensitive deployments.
- **CORS defaults to wildcard.** Safe because there is no cookie-based auth, but should be locked down if adding authentication.

## Recommendations for Public Exposure

If exposing TScribe to the internet:

1. Place behind Cloudflare Access, Authelia, or similar for authentication.
2. Set `TSCRIBE_CORS_ORIGINS` to your specific domain (e.g., `https://tscribe.example.com`).
3. Change `REDIS_PASSWORD` from the default value in `.env`.
4. Add rate limiting via [slowapi](https://github.com/laurentS/slowapi).
5. Enable WAF rules if using Cloudflare or similar CDN.
6. Restrict Docker published ports to `127.0.0.1` (e.g., `127.0.0.1:8000:8000`) so only the reverse proxy can reach the backend.

## Reporting Vulnerabilities

Report security issues via GitHub: https://github.com/LL4nc33/oidanice-tscribe/issues
