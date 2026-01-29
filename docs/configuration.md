[<< Back to README](../README.md)

# Configuration

Copy `.env.example` to `.env` and adjust as needed. All backend settings use the `TSCRIBE_` prefix.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `TSCRIBE_DEBUG` | `false` | Enable debug mode |
| `TSCRIBE_LOG_LEVEL` | `INFO` | Log level: DEBUG, INFO, WARNING, ERROR |
| `TSCRIBE_CORS_ORIGINS` | `["*"]` | Allowed CORS origins. Wildcard is safe (no cookie auth). |
| `TSCRIBE_DATABASE_URL` | `sqlite+aiosqlite:////data/tscribe.db` | Database connection |
| `TSCRIBE_REDIS_URL` | `redis://:...@redis:6379/0` | Redis URL (set by Compose) |
| `REDIS_PASSWORD` | `tscribe-redis-secret` | Redis password |
| `TSCRIBE_WHISPER_MODEL` | `base` | Model size (see table below) |
| `TSCRIBE_WHISPER_DEVICE` | `auto` | Device: `auto`, `cpu`, `cuda` |
| `TSCRIBE_WHISPER_COMPUTE_TYPE` | `int8` | Quantization: `int8`, `float16`, `float32` |
| `TSCRIBE_JOB_TIMEOUT_SECONDS` | `7200` | Max job duration (2 hours) |
| `TSCRIBE_CLEANUP_MAX_AGE_HOURS` | `24` | Auto-cleanup age for temp files |

## Whisper Models

| Model | VRAM | Relative Speed | Accuracy | Recommendation |
|-------|------|----------------|----------|----------------|
| `tiny` | ~1 GB | 10x | Basic | Testing only |
| `base` | ~1 GB | 7x | Good | **Default** -- best speed/quality balance |
| `small` | ~2 GB | 4x | Better | Good on modern CPUs |
| `medium` | ~5 GB | 2x | High | GPU recommended |
| `large-v3` | ~6 GB | 1x | Highest | Best quality, GPU required |
