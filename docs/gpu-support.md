[<< Back to README](../README.md)

# GPU Support

NVIDIA GPU acceleration provides 10-50x faster transcription.

## Setup

1. Install [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)

2. Uncomment the `deploy` section in `docker-compose.yml`:

```yaml
worker:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: all
            capabilities: [gpu]
```

3. Set compute type in `.env`:

```bash
TSCRIBE_WHISPER_COMPUTE_TYPE=float16
TSCRIBE_WHISPER_MODEL=large-v3  # optional: best quality
```

4. Rebuild:

```bash
docker compose up -d --build
```

## Performance Comparison

| Setup | 1-hour video |
|-------|-------------|
| CPU + `base` model | ~15-30 minutes |
| GPU + `large-v3` model | ~2 minutes |
