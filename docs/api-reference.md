[<< Back to README](../README.md)

# API Reference

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/` | Create transcription job (`{"url": "...", "language": "de"}`) |
| `GET` | `/api/jobs/` | List all jobs (without transcript text) |
| `GET` | `/api/jobs/{id}` | Get job with full details and transcript |
| `DELETE` | `/api/jobs/{id}` | Delete job and associated files |
| `GET` | `/api/jobs/{id}/download/{fmt}` | Download transcript (`srt`, `vtt`, `txt`, `json`) |
| `GET` | `/api/health` | Health check (returns `{"status": "ok"}`) |

## Examples

### Submit a video

```bash
curl -X POST http://localhost:8000/api/jobs/ \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}'
```

### Check status

```bash
curl http://localhost:8000/api/jobs/{id}
```

### Download SRT

```bash
curl -O http://localhost:8000/api/jobs/{id}/download/srt
```
