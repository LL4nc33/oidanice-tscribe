/**
 * Fetch-based API client for the TScribe backend.
 *
 * WHY: Fetch over axios because no extra dependency is needed.
 * The browser's native fetch API is sufficient for our JSON REST calls.
 * Base URL is /api which gets proxied to the backend in dev (Vite proxy)
 * and in production (nginx reverse proxy).
 */

import type { Job, JobListItem, CreateJobRequest } from '../types'

const BASE_URL = '/api'

/** WHY: Centralized error handling for all API calls.
 *  Throws with the server's error message when available. */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    const message = body?.detail || `HTTP ${response.status}: ${response.statusText}`
    throw new Error(message)
  }
  return response.json()
}

/** WHY: Creates a transcription job from a URL. Returns the full job
 *  object so the frontend can immediately show status. */
export async function createJob(data: CreateJobRequest): Promise<Job> {
  const response = await fetch(`${BASE_URL}/jobs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return handleResponse<Job>(response)
}

/** WHY: Fetches a single job with full details including result_text.
 *  Used for the detail view and polling active jobs. */
export async function getJob(id: string): Promise<Job> {
  const response = await fetch(`${BASE_URL}/jobs/${id}`)
  return handleResponse<Job>(response)
}

/** WHY: Fetches the job list without result_text for lightweight rendering.
 *  Used for the sidebar/list of recent jobs. */
export async function listJobs(): Promise<JobListItem[]> {
  const response = await fetch(`${BASE_URL}/jobs/`)
  return handleResponse<JobListItem[]>(response)
}

/** WHY: Deletes a job and its associated files.
 *  No return value needed - the job list will refresh via polling. */
export async function deleteJob(id: string): Promise<void> {
  const response = await fetch(`${BASE_URL}/jobs/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || `HTTP ${response.status}`)
  }
}

/** WHY: Returns the download URL as a string (not a fetch call) because
 *  we use it as an anchor href to trigger the browser's native download. */
export function getDownloadUrl(id: string, format: string): string {
  return `${BASE_URL}/jobs/${id}/download/${format}`
}
