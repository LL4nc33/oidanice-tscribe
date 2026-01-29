# OidaNice TScribe

Video and audio transcription service. Paste a URL, get a transcript.

Uses [faster-whisper](https://github.com/SYSTRAN/faster-whisper) for transcription and [yt-dlp](https://github.com/yt-dlp/yt-dlp) for audio extraction from YouTube and other platforms.

## Quick Start

```bash
cp .env.example .env
docker compose up -d
```

Open http://localhost:3000 in your browser.

## Architecture

```
Browser :3000 --> nginx (frontend) --> /api/* --> FastAPI :8000
                                                    |
                                                    v
                                              Redis :6379
                                                    |
                                                    v
                                                 Worker
                                           (yt-dlp + faster-whisper)
```

| Service    | Technology          | Purpose                        |
|------------|---------------------|--------------------------------|
| frontend   | React + nginx       | UI and API reverse proxy       |
| api        | FastAPI + SQLAlchemy | REST API, job management       |
| worker     | RQ + faster-whisper  | Audio download and transcription |
| redis      | Redis 7             | Job queue backend              |

Data flows: User submits URL via frontend. API creates a job in SQLite and enqueues it in Redis. Worker picks up the job, downloads audio with yt-dlp, transcribes with faster-whisper, and writes results back to the database.

## Environment Variables

| Variable                       | Default                              | Description                       |
|--------------------------------|--------------------------------------|-----------------------------------|
| `TSCRIBE_DEBUG`                | `false`                              | Enable debug mode                 |
| `TSCRIBE_DATABASE_URL`         | `sqlite+aiosqlite:///./data/tscribe.db` | Database connection string     |
| `TSCRIBE_REDIS_URL`            | `redis://redis:6379/0`               | Redis connection URL              |
| `TSCRIBE_WHISPER_MODEL`        | `base`                               | Whisper model size                |
| `TSCRIBE_WHISPER_DEVICE`       | `auto`                               | Compute device (auto/cpu/cuda)    |
| `TSCRIBE_WHISPER_COMPUTE_TYPE` | `int8`                               | Quantization type                 |
| `TSCRIBE_CLEANUP_MAX_AGE_HOURS`| `24`                                 | Auto-cleanup age in hours         |

## API Endpoints

| Method | Endpoint             | Description                    |
|--------|----------------------|--------------------------------|
| POST   | `/api/jobs`          | Submit URL for transcription   |
| GET    | `/api/jobs`          | List all jobs                  |
| GET    | `/api/jobs/{id}`     | Get job status and result      |
| DELETE | `/api/jobs/{id}`     | Delete a job                   |
| GET    | `/api/jobs/{id}/download/{fmt}` | Download transcript (srt, vtt, txt, json) |
| GET    | `/api/health`        | Health check                   |

## Development Setup

### Backend (without Docker)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Start API server
uvicorn app.main:app --reload --port 8000

# Start worker (separate terminal)
python -m app.worker
```

Requires Redis running locally on port 6379 and ffmpeg installed.

### Frontend (without Docker)

```bash
cd frontend
npm install
npm run dev
```

Dev server runs on http://localhost:5173 with hot reload.

## GPU Support

For NVIDIA GPU acceleration, install the [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html). The docker-compose.yml automatically uses available GPUs for the worker service.

Without a GPU, transcription runs on CPU (slower but fully functional).
