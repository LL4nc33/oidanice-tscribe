# OidaNice TScribe

<p align="center">
  <img src="frontend/public/favicon.svg" alt="TScribe" width="64" height="64" />
</p>

<p align="center">
  <strong>Self-hosted video &amp; audio transcription.</strong><br>
  Paste a URL, get a transcript.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.0.4a-black?style=flat-square" alt="Version" />
  <img src="https://img.shields.io/badge/docker-compose-black?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/whisper-AI-black?style=flat-square" alt="Whisper" />
  <img src="https://img.shields.io/badge/PWA-installable-black?style=flat-square" alt="PWA" />
  <img src="https://img.shields.io/badge/license-AGPL--3.0-black?style=flat-square" alt="License" />
</p>

---

## Features

- **Subtitle-first pipeline** -- fetches existing platform subtitles in ~3 seconds, falls back to Whisper AI only when needed
- **1000+ supported sites** -- YouTube, TikTok, Instagram, Facebook, X/Twitter, and everything else yt-dlp supports
- **Kindle-inspired UI** -- monochrome design with dark mode, serif typography, no distractions
- **Installable PWA** -- add to home screen on mobile with browser-specific install prompts
- **One-command setup** -- Docker Compose brings up all four services in seconds
- **Export formats** -- SRT, VTT, TXT, JSON with one-click download
- **Tunnel-ready** -- works behind Cloudflare Tunnel or any reverse proxy out of the box

---

## Screenshots

| Light Mode | Dark Mode | Mobile |
|:---:|:---:|:---:|
| ![Light Mode](docs/screenshots/light.png) | ![Dark Mode](docs/screenshots/dark.png) | ![Mobile](docs/screenshots/mobile.png) |

---

## Quick Start

```bash
git clone https://github.com/LL4nc33/oidanice-tscribe.git
cd oidanice-tscribe
cp .env.example .env
docker compose up -d
```

Open [http://localhost:58008](http://localhost:58008) and paste a video URL.

---

## Documentation

| Topic | Description |
|-------|-------------|
| [Configuration](docs/configuration.md) | Environment variables, Whisper model selection |
| [Architecture](docs/architecture.md) | System diagram, services, data flow, project structure |
| [GPU Support](docs/gpu-support.md) | NVIDIA setup for 10-50x faster transcription |
| [Reverse Proxy](docs/reverse-proxy.md) | Cloudflare Tunnel, nginx, CORS configuration |
| [API Reference](docs/api-reference.md) | REST endpoints and curl examples |
| [Development](docs/development.md) | Local backend/frontend setup and tests |
| [System Requirements](docs/system-requirements.md) | Minimum, recommended, and optimal hardware |
| [Roadmap](ROADMAP.md) | Planned features and future ideas |

---

## Security

All services run as non-root users. Redis is password-protected. URLs are validated against private IP ranges (SSRF protection). Job IDs are UUID-validated. See [SECURITY.md](SECURITY.md) for full details.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy, Pydantic |
| Transcription | faster-whisper (CTranslate2) |
| Media Download | yt-dlp |
| Queue | Redis 7, RQ (Redis Queue) |
| Database | SQLite (aiosqlite) |
| Infrastructure | Docker Compose, nginx |

---

Built by [OidaNice](https://github.com/LL4nc33/oidanice-tscribe) -- powered by faster-whisper -- built with [Claude Workflow Engine](https://github.com/LL4nc33/claude-workflow-engine) -- v0.0.4a
