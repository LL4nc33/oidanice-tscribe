[<< Back to README](../README.md)

# Architecture

## Overview

```
+--------------------------------------------------+
|  Browser / PWA                                   |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  nginx (frontend :3001)                          |
|  |-- Static files (React SPA)                    |
|  +-- /api/* reverse proxy ---+                   |
+------------------------------+-------------------+
                               |
                               v
+--------------------------------------------------+
|  FastAPI (api :8000)                             |
|  |-- Job CRUD endpoints                          |
|  |-- SQLite persistence                          |
|  +-- Redis job enqueue ------+                   |
+------------------------------+-------------------+
                               |
                               v
+--------------------------------------------------+
|  Redis Queue (:6379, password-protected)         |
+-------------------------+------------------------+
                          |
                          v
+--------------------------------------------------+
|  Worker                                          |
|  |-- Phase 0: Fetch platform subtitles (~3s)     |
|  |-- Phase 1: Download audio via yt-dlp          |
|  |-- Phase 2: Transcribe via faster-whisper      |
|  +-- Phase 3: Cleanup temp files                 |
+--------------------------------------------------+
```

## Services

| Service | Image | Purpose |
|---------|-------|---------|
| **frontend** | nginx-unprivileged:alpine | React SPA + API reverse proxy |
| **api** | python:3.12-slim | REST API, job management, SQLite |
| **worker** | python:3.12-slim | Media download + transcription |
| **redis** | redis:7-alpine | Job queue backend (password-protected) |

## Data Flow

URL submitted -- API creates job in SQLite -- enqueued in Redis -- Worker tries subtitle fetch first (fast path) -- falls back to audio download + Whisper -- results saved to DB -- available for export.

## Project Structure

```
oidanice-tscribe/
|-- backend/
|   |-- app/
|   |   |-- main.py              # FastAPI application
|   |   |-- config.py            # Settings (env vars)
|   |   |-- models.py            # SQLAlchemy models
|   |   |-- schemas.py           # Pydantic schemas
|   |   |-- database.py          # DB connection + migrations
|   |   |-- routes/
|   |   |   |-- jobs.py          # Job CRUD + download endpoints
|   |   |   +-- health.py        # Health check
|   |   +-- worker/
|   |       |-- tasks.py         # Job execution pipeline
|   |       |-- subtitles.py     # Subtitle-first fetcher
|   |       |-- download.py      # yt-dlp audio download
|   |       |-- transcribe.py    # faster-whisper wrapper
|   |       |-- shutdown.py      # Graceful SIGTERM handler
|   |       +-- cleanup.py       # File cleanup sweep
|   |-- tests/                   # pytest test suite
|   |-- Dockerfile
|   |-- entrypoint.sh            # Non-root permission fix
|   +-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- App.tsx              # Main application
|   |   |-- api/client.ts        # API client
|   |   |-- components/          # React components
|   |   |-- hooks/               # Custom hooks
|   |   +-- types/               # TypeScript types
|   |-- public/
|   |   |-- manifest.json        # PWA manifest
|   |   |-- sw.js                # Service worker
|   |   +-- favicon.svg          # Monochrome favicon
|   |-- Dockerfile
|   +-- nginx.conf               # Reverse proxy config
|-- docker-compose.yml
|-- .env.example
|-- SECURITY.md
|-- CHANGELOG.md
+-- README.md
```
