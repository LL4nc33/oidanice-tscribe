# Roadmap

What's planned and what might come next.

> Version source of truth: [`VERSION`](VERSION)

---

## v0.0.5 — API & Integrations

- [ ] Synchronous `/api/transcribe` endpoint for LLM tool-use (OidaNiceGPT, OpenWebUI)
- [ ] API key authentication (optional, for public deployments)
- [ ] Webhook notifications on job completion
- [ ] Batch URL submission (multiple URLs in one request)

## v0.0.6 — Transcription Quality

- [ ] Language detection and selection UI
- [ ] Speaker diarization (who said what)
- [ ] Whisper model selection per job (tiny → large-v3)
- [ ] Word-level timestamps for karaoke-style subtitles

## v0.0.7 — User Experience

- [ ] Job history with search and filters
- [ ] Inline transcript editor (correct mistakes before export)
- [ ] Audio/video player with synced transcript highlighting
- [ ] Drag-and-drop local file upload (not just URLs)

## v0.0.8 — Multi-User & Storage

- [ ] User accounts with optional authentication
- [ ] Persistent transcript library per user
- [ ] Storage management (auto-cleanup, quotas)
- [ ] Share transcripts via public link

## Backlog (no timeline)

- [ ] AI transcript cleanup (grammar, punctuation, readability via LLM)
- [ ] Translation (transcribe + translate to target language)
- [ ] Summary generation via LLM integration
- [ ] Custom vocabulary / hotwords for domain-specific terms
- [ ] Podcast RSS feed auto-transcription
- [ ] Browser extension (right-click → transcribe)
- [ ] Mobile app (React Native, sharing the kindle-ui design system)
- [ ] Kubernetes Helm chart
- [ ] Prometheus metrics endpoint

---

Ideas and suggestions: [open an issue](https://github.com/LL4nc33/oidanice-tscribe/issues)
