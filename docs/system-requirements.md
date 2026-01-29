[<< Back to README](../README.md)

# System Requirements

## Minimum (CPU-only, subtitle-first)

| Resource | Requirement |
|----------|-------------|
| CPU | 2 cores |
| RAM | 2 GB |
| Disk | 5 GB free |
| OS | Linux, macOS, or Windows (Docker Desktop) |
| Software | Docker 20+, Docker Compose v2 |

With the subtitle-first pipeline, most YouTube/TikTok videos are transcribed in ~3 seconds without any Whisper processing. CPU-only is perfectly usable for subtitle-fetching and short audio clips.

## Recommended (Whisper transcription)

| Resource | Requirement |
|----------|-------------|
| CPU | 4+ cores |
| RAM | 4 GB (8 GB for `large-v3` model) |
| Disk | 10 GB free |
| GPU | NVIDIA with 4+ GB VRAM (optional, 10-50x faster) |
| Software | Docker 20+, Docker Compose v2, nvidia-container-toolkit (for GPU) |

## Optimal (Production, GPU)

| Resource | Requirement |
|----------|-------------|
| CPU | 4+ cores |
| RAM | 8+ GB |
| Disk | 20 GB SSD |
| GPU | NVIDIA RTX 3060+ with 6+ GB VRAM |
| Software | Docker 20+, nvidia-container-toolkit |
| Network | Stable internet for media downloads |

GPU transcription with `large-v3` model processes a 1-hour video in ~2 minutes. CPU with `base` model takes ~15-30 minutes for the same content.
