# WHY python:3.12-slim: Minimal image size (~150MB vs ~900MB full).
# Provides everything needed for pip installs without bloat.
FROM python:3.12-slim

# WHY ffmpeg: Required by both yt-dlp (audio extraction from video)
# and faster-whisper (audio decoding for transcription).
RUN apt-get update && \
    apt-get install -y --no-install-recommends ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# WHY copy requirements first: Docker layer caching. Dependencies change
# less often than app code, so this layer is cached across builds.
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# WHY copy app code after deps: Any code change only rebuilds from here,
# not from the expensive pip install layer.
COPY . .

# WHY /data directory: Persistent storage mount point for SQLite database,
# downloaded audio files, and transcription output.
RUN mkdir -p /data

EXPOSE 8000

# WHY --host 0.0.0.0: Bind to all interfaces so the container is reachable
# from outside (default 127.0.0.1 would only be accessible inside the container).
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
