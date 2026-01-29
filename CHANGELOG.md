# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.4a] - 2026-01-29

### Security

- Orphaned job recovery on worker restart
- SSRF protection (block private/reserved IP ranges)
- Non-root containers via gosu entrypoint (UID 1000)
- Redis password authentication
- UUID validation on job_id path parameters
- CORS restricted to GET/POST/DELETE methods
- nginx security headers (nosniff, frame deny, referrer policy)
- nginx-unprivileged base image for frontend

### Added

- PWA support (manifest, service worker, install prompt)
- Smart install prompt with browser-specific instructions (Chrome, Safari, Firefox, Samsung)
- Tunnel-ready configuration (proxy headers, flexible CORS)
- Mobile platform filter: icon-only chips, active shows label

## [0.0.4] - 2026-01-29

### Added

- Subtitle-first transcription pipeline (~3s vs ~5min for YouTube)
- Transcription source display (via subtitles/whisper + duration)
- Platform filter with brand SVG icons (YouTube, TikTok, Instagram, Facebook, X)
- Job management: delete per job, clear all
- Unicode status indicators with pulse animation
- Copy button feedback (copied checkmark, 3s, bg inversion)
- Dark mode toggle with sun/moon symbols
- CSS-only download button hover/focus/active states
- Professional footer (powered by faster-whisper, built by OidaNice, version)
- SVG favicon (serif T with sound wave dots)

### Changed

- Typography hierarchy (4-level: page title, section headers, content title, meta)
- Layout: full-width input/button, card container for job detail
- Transcript height: max-h-[60vh] instead of max-h-96
- Section spacing: space-y-6 instead of space-y-8
- Removed `<hr>` separators, replaced with cards and background changes
- Progress bar: h-1.5, borderless, inline percentage, smooth transition
- All dependencies updated to latest versions (yt-dlp 2026.1.29, redis 7, etc.)

## [0.0.3] - 2026-01-29

### Added

- Real-time progress bar during transcription
- Docker healthchecks for all 4 services
- Structured logging with configurable level
- Graceful SIGTERM handling via GracefulWorker
- Test suite: 50 tests (formats, API, subtitles)
- Error boundary component
- API error display in frontend
- SVG favicon
- Conditional polling (stops when all jobs terminal)

### Changed

- Compressed audio download (native format instead of WAV)
- Fixed stale RQ worker key on container restart
- Closed Redis port from host network
- Fixed README inaccuracies

### Fixed

- Frontend healthcheck: localhost to 127.0.0.1 for Alpine wget

## [0.0.2] - 2026-01-29

### Fixed

- Download endpoint crash (dict to Segment conversion)
- Audio files not cleaned after transcription
- Stale file cleanup never called
- No RQ job timeout (added 2h default)
- Job deletion not removing files from disk

## [0.0.1] - 2026-01-29

### Added

- Initial implementation
- FastAPI backend with SQLite + Redis/RQ
- React frontend with Tailwind CSS
- faster-whisper transcription engine
- yt-dlp media download
- Docker Compose orchestration
- SRT, VTT, TXT, JSON export formats
- Dark mode support
- Kindle/E-Reader monochrome aesthetic

[0.0.4a]: https://github.com/oidanice/tscribe/compare/v0.0.4...v0.0.4a
[0.0.4]: https://github.com/oidanice/tscribe/compare/v0.0.3...v0.0.4
[0.0.3]: https://github.com/oidanice/tscribe/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/oidanice/tscribe/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/oidanice/tscribe/releases/tag/v0.0.1
