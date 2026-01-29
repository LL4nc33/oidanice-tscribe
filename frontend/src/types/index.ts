/**
 * TypeScript interfaces matching backend Pydantic schemas.
 *
 * WHY: Shared type definitions ensure frontend and backend stay in sync.
 * These mirror the backend's schemas.py exactly so API responses can be
 * typed without runtime validation overhead.
 */

/** WHY: String enum mirrors backend JobStatus for exhaustive switch statements. */
export enum JobStatus {
  QUEUED = 'queued',
  DOWNLOADING = 'downloading',
  TRANSCRIBING = 'transcribing',
  DONE = 'done',
  FAILED = 'failed',
}

/** WHY: Full job response includes result_text for the detail view. */
export interface Job {
  id: string
  url: string
  status: JobStatus
  title: string | null
  language: string | null
  detected_language: string | null
  duration_seconds: number | null
  progress: number
  result_text: string | null
  error: string | null
  created_at: string
  completed_at: string | null
}

/** WHY: List item excludes result_text to keep list responses lightweight.
 *  Full transcript is only fetched when the user selects a specific job. */
export interface JobListItem {
  id: string
  url: string
  status: JobStatus
  title: string | null
  progress: number
  created_at: string
  completed_at: string | null
}

/** WHY: Minimal request body - only URL is required.
 *  Language is optional because faster-whisper auto-detects well. */
export interface CreateJobRequest {
  url: string
  language?: string
}
