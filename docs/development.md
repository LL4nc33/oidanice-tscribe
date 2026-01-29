[<< Back to README](../README.md)

# Development

## Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000     # API server
python run_worker.py                            # Worker (separate terminal)
```

Requires: Redis on localhost:6379, ffmpeg installed.

## Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## Tests

```bash
cd backend
pip install -r requirements-test.txt
pytest -v      # 50 tests (formats, API, subtitles)
```
